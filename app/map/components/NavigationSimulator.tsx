'use client';

import { useEffect, useRef, useState } from 'react';
import { getVoiceNavigator } from '../utils/voiceNavigator';

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates?: [number, number];
}

interface NavigationSimulatorProps {
  routeCoordinates: [number, number][];
  routeSteps: RouteStep[];
  speed: number; // км/ч
  onPositionUpdate: (position: [number, number], bearing: number) => void;
  onStepChange: (stepIndex: number, distanceToStep: number) => void;
  onArrival: () => void;
  isActive: boolean;
  stationName?: string;
  locale?: string;
}

export function NavigationSimulator({
  routeCoordinates,
  routeSteps,
  speed,
  onPositionUpdate,
  onStepChange,
  onArrival,
  isActive,
  stationName = 'зарядки',
  locale = 'ru',
}: NavigationSimulatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const voiceNavigator = getVoiceNavigator();
  const hasAnnouncedStartRef = useRef(false);

  // Объявляем начало навигации при первом запуске
  useEffect(() => {
    if (isActive && !hasAnnouncedStartRef.current) {
      voiceNavigator.setLocale(locale);
      voiceNavigator.setSpeed(speed); // Передаём скорость голосовому навигатору
      voiceNavigator.announceNavigationStart(stationName);
      hasAnnouncedStartRef.current = true;
    }

    if (!isActive) {
      hasAnnouncedStartRef.current = false;
    }
  }, [isActive, stationName, voiceNavigator, speed]);

  // Обновляем скорость в голосовом навигаторе при её изменении
  useEffect(() => {
    if (isActive) {
      voiceNavigator.setSpeed(speed);
    }
  }, [speed, isActive, voiceNavigator]);

  useEffect(() => {
    if (!isActive || routeCoordinates.length < 2) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Скорость в метрах в секунду
    const speedMps = (speed * 1000) / 3600;
    
    // Обновляем позицию каждые 100ms для плавности
    const updateInterval = 100;
    
    intervalRef.current = setInterval(() => {
      setProgress((prevProgress) => {
        if (currentIndex >= routeCoordinates.length - 1) {
          // Достигли конца маршрута
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Используем setTimeout для вызова onArrival вне рендера
          setTimeout(() => onArrival(), 0);
          return 0;
        }

        const start = routeCoordinates[currentIndex];
        const end = routeCoordinates[currentIndex + 1];
        
        // Вычисляем расстояние между точками
        const distance = calculateDistance(start[1], start[0], end[1], end[0]) * 1000; // в метрах
        
        // Вычисляем, насколько продвинуться за этот интервал
        const distancePerInterval = (speedMps * updateInterval) / 1000;
        const progressIncrement = distancePerInterval / distance;
        
        const newProgress = prevProgress + progressIncrement;
        
        if (newProgress >= 1) {
          // Переходим к следующему сегменту
          setCurrentIndex((prev) => prev + 1);
          return 0;
        }
        
        // Интерполируем позицию
        const lat = start[1] + (end[1] - start[1]) * newProgress;
        const lng = start[0] + (end[0] - start[0]) * newProgress;
        
        // Вычисляем направление (bearing)
        const bearing = calculateBearing(start[1], start[0], end[1], end[0]);
        
        // Используем setTimeout для вызова callbacks вне рендера
        setTimeout(() => {
          onPositionUpdate([lng, lat], bearing);
          updateStepProgress([lng, lat]);
        }, 0);
        
        return newProgress;
      });
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, currentIndex, speed, routeCoordinates, onPositionUpdate, onStepChange, onArrival, routeSteps]);

  const updateStepProgress = (currentPosition: [number, number]) => {
    // Находим текущий шаг маршрута
    let accumulatedDistance = 0;
    let currentStepIndex = 0;
    
    for (let i = 0; i < routeSteps.length; i++) {
      accumulatedDistance += routeSteps[i].distance;
      
      // Вычисляем пройденное расстояние
      let traveledDistance = 0;
      for (let j = 0; j <= currentIndex; j++) {
        if (j < routeCoordinates.length - 1) {
          const segmentDistance = calculateDistance(
            routeCoordinates[j][1],
            routeCoordinates[j][0],
            routeCoordinates[j + 1][1],
            routeCoordinates[j + 1][0]
          ) * 1000;
          
          if (j === currentIndex) {
            traveledDistance += segmentDistance * progress;
          } else {
            traveledDistance += segmentDistance;
          }
        }
      }
      
      if (traveledDistance < accumulatedDistance) {
        currentStepIndex = i;
        const distanceToStep = accumulatedDistance - traveledDistance;
        
        // Используем setTimeout для вызова callback вне рендера
        setTimeout(() => {
          onStepChange(currentStepIndex, distanceToStep);
        }, 0);
        
        // Голосовые подсказки через VoiceNavigator
        // ВАЖНО: маневр в OSRM находится в НАЧАЛЕ шага, поэтому пока мы едем в шаге N,
        // мы должны объявлять инструкцию ПРЕДСТОЯЩЕГО маневра — это начало шага N+1
        const upcomingStepIndex = currentStepIndex + 1;
        if (upcomingStepIndex < routeSteps.length) {
          voiceNavigator.announceManeuver(
            upcomingStepIndex,
            routeSteps[upcomingStepIndex].instruction,
            distanceToStep
          );
        }
        
        break;
      }
    }
  };

  return null; // Этот компонент не рендерит UI
}

// Вспомогательные функции
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Радиус Земли в км
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}
