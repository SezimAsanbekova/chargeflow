'use client';

import { Navigation, Clock, List, X } from 'lucide-react';

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

interface NavigationPanelProps {
  currentStep: RouteStep;
  nextStep?: RouteStep;
  distanceToStep: number;
  remainingDistance: number;
  remainingTime: number;
  allSteps: RouteStep[];
  currentStepIndex: number;
  onShowAllSteps: () => void;
  onFinish: () => void;
  showAllSteps: boolean;
  onStepClick: (index: number) => void;
  t?: any;
}

export function NavigationPanel({
  currentStep,
  nextStep,
  distanceToStep,
  remainingDistance,
  remainingTime,
  allSteps,
  currentStepIndex,
  onShowAllSteps,
  onFinish,
  showAllSteps,
  onStepClick,
  t,
}: NavigationPanelProps) {
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} ${t?.route?.m ?? 'м'}`;
    }
    return `${(meters / 1000).toFixed(1)} ${t?.route?.km ?? 'км'}`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} ${t?.route?.min ?? 'мин'}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ${t?.navPanel?.hour ?? 'ч'} ${mins} ${t?.route?.min ?? 'мин'}`;
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* Верхняя панель со статистикой - показывается когда открыт список шагов */}
      {showAllSteps && (
        <div className="bg-[#0d2d26] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Расстояние до станции */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600/20 rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <div className="text-white text-2xl font-bold leading-none">
                  {formatDistance(remainingDistance * 1000)}
                </div>
                <div className="text-gray-400 text-xs mt-1">{t?.navPanel?.toStation ?? 'до станции'}</div>
              </div>
            </div>

            {/* Время в пути */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600/20 rounded-full flex items-center justify-center">
                <Clock size={20} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-white text-2xl font-bold leading-none">
                  {formatTime(remainingTime)}
                </div>
                <div className="text-gray-400 text-xs mt-1">{t?.navPanel?.enRoute ?? 'в пути'}</div>
              </div>
            </div>
          </div>

          {/* Кнопка закрытия */}
          <button
            onClick={onShowAllSteps}
            className="w-10 h-10 flex items-center justify-center hover:bg-red-500/20 rounded-lg transition"
          >
            <X size={28} className="text-red-400" />
          </button>
        </div>
      )}

      {/* Основная панель навигации - скрывается когда открыт список */}
      {!showAllSteps && (
        <div className="bg-[#1a3d35] rounded-t-3xl shadow-2xl">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-white/30 rounded-full"></div>
          </div>

          {/* Main Content */}
          <div className="px-6 pb-6">
            {/* Distance to next maneuver */}
            <div className="text-emerald-400 text-base font-medium mb-4">
              {(t?.navPanel?.inDistance ?? 'Через {distance}').replace('{distance}',
                distanceToStep < 1000 
                  ? `${Math.round(distanceToStep)} ${t?.route?.m ?? 'м'}`
                  : `${(distanceToStep / 1000).toFixed(1)} ${t?.route?.km ?? 'км'}`
              )}
            </div>

            {/* Main instruction - крупная надпись */}
            <div className="mb-6">
              <div className="text-white text-3xl font-bold leading-tight">
                {currentStep.instruction}
              </div>
            </div>

            {/* Next step preview - маленькая иконка и текст */}
            {nextStep && (
              <div className="flex items-center gap-2 text-gray-300 mb-5">
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <Navigation size={16} className="text-gray-400" />
                </div>
                <span className="text-sm flex-1">{nextStep.instruction}</span>
                <span className="text-sm text-gray-400">
                  {formatDistance(nextStep.distance)}
                </span>
              </div>
            )}

            {/* Bottom row: All steps button and time */}
            <div className="flex items-center justify-between mb-5">
              {/* All steps button */}
              <button
                onClick={onShowAllSteps}
                className="flex items-center gap-2 text-emerald-400 font-medium text-sm py-2 hover:bg-emerald-500/10 rounded-lg transition"
              >
                <List size={20} />
                <span>{t?.navPanel?.allSteps ?? 'Все шаги'}</span>
              </button>

              {/* Time */}
              <div className="flex items-center gap-2 text-sm">
                <Clock size={18} className="text-gray-400" />
                <span className="text-white font-medium">{formatTime(remainingTime)}</span>
              </div>
            </div>

            {/* Finish button - большая красная кнопка */}
            <button
              onClick={onFinish}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-bold text-lg transition shadow-lg"
            >
              {t?.navPanel?.finish ?? 'Завершить'}
            </button>
          </div>
        </div>
      )}

      {/* All Steps List - показывается при нажатии */}
      {showAllSteps && (
        <div className="bg-[#0f2d26] max-h-[60vh] overflow-y-auto">
          <div className="px-5 py-4">
            <div className="space-y-2">
              {allSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => onStepClick(idx)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                    idx === currentStepIndex
                      ? 'bg-emerald-600/30 border-2 border-emerald-500'
                      : idx < currentStepIndex
                      ? 'bg-gray-800/30 opacity-50'
                      : 'bg-[#1a3d35] hover:bg-emerald-900/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    idx === currentStepIndex
                      ? 'bg-emerald-600 text-white'
                      : idx < currentStepIndex
                      ? 'bg-gray-600 text-gray-400'
                      : 'bg-[#0f2d26] text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`text-sm font-medium ${
                      idx === currentStepIndex ? 'text-emerald-400' : 'text-white'
                    }`}>
                      {step.instruction}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatDistance(step.distance)}
                    </div>
                  </div>
                  {idx === currentStepIndex && (
                    <div className="text-emerald-400 text-xs font-bold bg-emerald-600/20 px-2 py-1 rounded">
                      {t?.navPanel?.now ?? 'Сейчас'}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compass indicator - компас с буквой N слева внизу */}
      {!showAllSteps && (
        <div className="fixed left-6 bottom-8 z-40">
          <div className="w-14 h-14 bg-[#1a3d35] rounded-full flex items-center justify-center shadow-xl border-2 border-emerald-500/30">
            <span className="text-white text-2xl font-bold">N</span>
          </div>
        </div>
      )}
    </div>
  );
}
