# API Examples for Navigation Simulator

## Component Usage Examples

### 1. NavigationPanel

```tsx
import { NavigationPanel } from './components/NavigationPanel';

function MyNavigationApp() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);
  
  const routeSteps = [
    { instruction: "Начните движение", distance: 500, duration: 60 },
    { instruction: "Поверните налево", distance: 1200, duration: 120 },
    { instruction: "Продолжайте прямо", distance: 3000, duration: 300 },
  ];

  return (
    <NavigationPanel
      currentStep={routeSteps[currentStepIndex]}
      nextStep={routeSteps[currentStepIndex + 1]}
      distanceToStep={250}
      remainingDistance={4.7}
      remainingTime={480}
      allSteps={routeSteps}
      currentStepIndex={currentStepIndex}
      onShowAllSteps={() => setShowAllSteps(!showAllSteps)}
      onFinish={() => console.log('Navigation finished')}
      showAllSteps={showAllSteps}
      onStepClick={(index) => setCurrentStepIndex(index)}
    />
  );
}
```

### 2. NavigationSimulator

```tsx
import { NavigationSimulator } from './components/NavigationSimulator';

function MySimulationApp() {
  const [isActive, setIsActive] = useState(false);
  const [speed, setSpeed] = useState(40);
  
  const routeCoordinates: [number, number][] = [
    [74.6057, 42.8746],
    [74.6067, 42.8756],
    [74.6077, 42.8766],
    // ... more coordinates
  ];
  
  const routeSteps = [
    { instruction: "Начните движение", distance: 500, duration: 60 },
    { instruction: "Поверните налево", distance: 1200, duration: 120 },
  ];

  const handlePositionUpdate = (position: [number, number], bearing: number) => {
    console.log('New position:', position);
    console.log('Bearing:', bearing);
    // Update marker on map
  };

  const handleStepChange = (stepIndex: number, distanceToStep: number) => {
    console.log('Current step:', stepIndex);
    console.log('Distance to step:', distanceToStep);
    // Update UI
  };

  const handleArrival = () => {
    console.log('Arrived at destination!');
    setIsActive(false);
  };

  return (
    <>
      <button onClick={() => setIsActive(!isActive)}>
        {isActive ? 'Pause' : 'Start'}
      </button>
      
      <NavigationSimulator
        routeCoordinates={routeCoordinates}
        routeSteps={routeSteps}
        speed={speed}
        onPositionUpdate={handlePositionUpdate}
        onStepChange={handleStepChange}
        onArrival={handleArrival}
        isActive={isActive}
      />
    </>
  );
}
```

### 3. SimulationControls

```tsx
import { SimulationControls } from './components/SimulationControls';

function MyControlPanel() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(40);

  return (
    <SimulationControls
      isPlaying={isPlaying}
      speed={speed}
      onPlayPause={() => setIsPlaying(!isPlaying)}
      onReset={() => {
        setIsPlaying(false);
        console.log('Reset simulation');
      }}
      onSpeedChange={(newSpeed) => setSpeed(newSpeed)}
      onExit={() => {
        setIsPlaying(false);
        console.log('Exit simulation');
      }}
    />
  );
}
```

## Full Integration Example

```tsx
import { useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { NavigationPanel } from './components/NavigationPanel';
import { NavigationSimulator } from './components/NavigationSimulator';
import { SimulationControls } from './components/SimulationControls';

function FullNavigationExample() {
  // State
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(40);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceToStep, setDistanceToStep] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);
  
  // Refs
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  
  // Mock data
  const routeCoordinates: [number, number][] = [
    [74.6057, 42.8746],
    [74.6067, 42.8756],
    [74.6077, 42.8766],
  ];
  
  const routeSteps = [
    { instruction: "Начните движение", distance: 500, duration: 60 },
    { instruction: "Поверните налево", distance: 1200, duration: 120 },
    { instruction: "Вы прибыли", distance: 0, duration: 0 },
  ];

  // Handlers
  const handleStartSimulation = () => {
    setIsSimulating(true);
    setIsPlaying(true);
    setCurrentStepIndex(0);
    
    // Create marker
    if (mapRef.current && !markerRef.current) {
      markerRef.current = new maplibregl.Marker()
        .setLngLat(routeCoordinates[0])
        .addTo(mapRef.current);
    }
  };

  const handlePositionUpdate = (position: [number, number], bearing: number) => {
    // Update marker
    if (markerRef.current) {
      markerRef.current.setLngLat(position);
      markerRef.current.setRotation(bearing);
    }
    
    // Update map
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: position,
        bearing: bearing,
        duration: 100,
      });
    }
  };

  const handleStepChange = (stepIndex: number, distance: number) => {
    setCurrentStepIndex(stepIndex);
    setDistanceToStep(distance);
  };

  const handleArrival = () => {
    alert('Вы прибыли!');
    handleStopSimulation();
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
    setIsPlaying(false);
    
    // Remove marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setDistanceToStep(routeSteps[0].distance);
    
    if (markerRef.current) {
      markerRef.current.setLngLat(routeCoordinates[0]);
    }
  };

  return (
    <div className="relative h-screen">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Start Button */}
      {!isSimulating && (
        <button
          onClick={handleStartSimulation}
          className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Начать тест-драйв
        </button>
      )}

      {/* Simulation Controls */}
      {isSimulating && (
        <SimulationControls
          isPlaying={isPlaying}
          speed={speed}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onReset={handleReset}
          onSpeedChange={setSpeed}
          onExit={handleStopSimulation}
        />
      )}

      {/* Navigation Simulator */}
      {isSimulating && (
        <NavigationSimulator
          routeCoordinates={routeCoordinates}
          routeSteps={routeSteps}
          speed={speed}
          onPositionUpdate={handlePositionUpdate}
          onStepChange={handleStepChange}
          onArrival={handleArrival}
          isActive={isPlaying}
        />
      )}

      {/* Navigation Panel */}
      {isSimulating && (
        <NavigationPanel
          currentStep={routeSteps[currentStepIndex]}
          nextStep={routeSteps[currentStepIndex + 1]}
          distanceToStep={distanceToStep}
          remainingDistance={
            routeSteps.slice(currentStepIndex).reduce((sum, step) => sum + step.distance, 0) / 1000
          }
          remainingTime={
            routeSteps.slice(currentStepIndex).reduce((sum, step) => sum + step.duration, 0)
          }
          allSteps={routeSteps}
          currentStepIndex={currentStepIndex}
          onShowAllSteps={() => setShowAllSteps(!showAllSteps)}
          onFinish={handleStopSimulation}
          showAllSteps={showAllSteps}
          onStepClick={setCurrentStepIndex}
        />
      )}
    </div>
  );
}

export default FullNavigationExample;
```

## Utility Functions

### Calculate Distance (Haversine)

```typescript
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
```

### Calculate Bearing

```typescript
function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}
```

### Format Distance

```typescript
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  }
  return `${(meters / 1000).toFixed(1)} км`;
}
```

### Format Time

```typescript
function formatTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} ч ${mins} мин`;
}
```

### Voice Announcement

```typescript
function speakInstruction(instruction: string, distance?: number): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance();
    
    if (distance && distance > 10) {
      utterance.text = `Через ${Math.round(distance)} метров ${instruction.toLowerCase()}`;
    } else {
      utterance.text = instruction;
    }
    
    utterance.lang = 'ru-RU';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}
```

## OSRM API Integration

### Fetch Route

```typescript
async function fetchRoute(
  start: [number, number],
  end: [number, number]
): Promise<RouteData> {
  const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&steps=true&annotations=true`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }
  
  const route = data.routes[0];
  
  return {
    coordinates: route.geometry.coordinates,
    distance: route.distance,
    duration: route.duration,
    steps: route.legs[0].steps.map((step: any) => ({
      instruction: parseInstruction(step.maneuver),
      distance: step.distance,
      duration: step.duration,
    })),
  };
}

function parseInstruction(maneuver: any): string {
  const type = maneuver.type;
  const modifier = maneuver.modifier;
  
  if (type === 'depart') return 'Начните движение';
  if (type === 'arrive') return 'Вы прибыли';
  if (type === 'turn' && modifier === 'left') return 'Поверните налево';
  if (type === 'turn' && modifier === 'right') return 'Поверните направо';
  if (type === 'continue') return 'Продолжайте движение прямо';
  
  return 'Продолжайте движение';
}
```

## TypeScript Types

```typescript
interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates?: [number, number];
}

interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  steps: RouteStep[];
}

interface NavigationState {
  isNavigating: boolean;
  isSimulating: boolean;
  currentStepIndex: number;
  distanceToStep: number;
  simulatedPosition: [number, number] | null;
  simulatedBearing: number;
}
```
