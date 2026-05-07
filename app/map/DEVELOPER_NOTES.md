# Developer Notes: Navigation Simulator

## Architecture Overview

### Component Structure

```
app/map/
├── page.tsx                          # Main map page with navigation logic
├── components/
│   ├── NavigationPanel.tsx           # Navigation UI panel (2GIS-style)
│   ├── NavigationSimulator.tsx       # Movement simulation engine
│   └── SimulationControls.tsx        # Simulation control panel
└── NAVIGATION_SIMULATOR_README.md    # User documentation
```

## Key Components

### 1. NavigationPanel.tsx

**Purpose:** Displays navigation instructions in 2GIS style

**Props:**
- `currentStep`: Current navigation step
- `nextStep`: Next navigation step (optional)
- `distanceToStep`: Distance to current step in meters
- `remainingDistance`: Total remaining distance in km
- `remainingTime`: Total remaining time in seconds
- `allSteps`: Array of all route steps
- `currentStepIndex`: Index of current step
- `onShowAllSteps`: Callback to toggle steps list
- `onFinish`: Callback to finish navigation
- `showAllSteps`: Boolean to show/hide steps list
- `onStepClick`: Callback when step is clicked

**Features:**
- Direction icons based on instruction text
- Distance formatting (meters/kilometers)
- Time formatting (minutes/hours)
- Expandable steps list
- Current step highlighting

### 2. NavigationSimulator.tsx

**Purpose:** Simulates movement along route coordinates

**Props:**
- `routeCoordinates`: Array of [lng, lat] coordinates
- `routeSteps`: Array of route steps with instructions
- `speed`: Speed in km/h
- `onPositionUpdate`: Callback with (position, bearing)
- `onStepChange`: Callback with (stepIndex, distanceToStep)
- `onArrival`: Callback when destination reached
- `isActive`: Boolean to control simulation

**Algorithm:**
1. Interpolates position between route coordinates
2. Calculates bearing (direction) for marker rotation
3. Updates position every 100ms for smooth movement
4. Tracks distance to current step
5. Triggers voice announcements at 50m before turn

**Key Functions:**
- `calculateDistance()`: Haversine formula for distance
- `calculateBearing()`: Bearing between two points
- `updateStepProgress()`: Determines current step and distance
- `speakInstruction()`: Web Speech API for voice

### 3. SimulationControls.tsx

**Purpose:** Control panel for simulation

**Props:**
- `isPlaying`: Boolean for play/pause state
- `speed`: Current speed in km/h
- `onPlayPause`: Callback to toggle play/pause
- `onReset`: Callback to reset to start
- `onSpeedChange`: Callback with new speed
- `onExit`: Callback to exit simulation

**Features:**
- Speed selector (10, 20, 40, 60 km/h)
- Play/Pause button
- Reset button
- Exit button

## State Management

### Main Page State (page.tsx)

```typescript
// Navigation states
const [isNavigating, setIsNavigating] = useState(false);
const [currentStepIndex, setCurrentStepIndex] = useState(0);
const [showNavigationDetails, setShowNavigationDetails] = useState(false);

// Simulation states
const [isSimulating, setIsSimulating] = useState(false);
const [simulationSpeed, setSimulationSpeed] = useState(40);
const [isSimulationPaused, setIsSimulationPaused] = useState(false);
const [simulatedPosition, setSimulatedPosition] = useState<[number, number] | null>(null);
const [simulatedBearing, setSimulatedBearing] = useState(0);
const [distanceToCurrentStep, setDistanceToCurrentStep] = useState(0);
const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

// Refs
const simulatedMarkerRef = useRef<maplibregl.Marker | null>(null);
```

## Key Functions

### Route Building

```typescript
const buildRoute = async (station: Station) => {
  // 1. Fetch route from OSRM API
  // 2. Extract coordinates and steps
  // 3. Save to state (routeCoordinates, routeInfo)
  // 4. Draw route on map
  // 5. Fit map bounds to route
}
```

### Simulation Control

```typescript
const startSimulation = () => {
  // 1. Set simulation flags
  // 2. Create simulated marker
  // 3. Center map on start
  // 4. Start trip timer
}

const pauseSimulation = () => {
  setIsSimulationPaused(true);
}

const resumeSimulation = () => {
  setIsSimulationPaused(false);
}

const resetSimulation = () => {
  // 1. Reset to first step
  // 2. Reset position to start
  // 3. Update marker and map
}

const stopSimulation = () => {
  // 1. Clear simulation flags
  // 2. Remove simulated marker
  // 3. Clean up state
}
```

### Position Updates

```typescript
const handleSimulationPositionUpdate = (position: [number, number], bearing: number) => {
  // 1. Update simulated position state
  // 2. Update marker position and rotation
  // 3. Move map to follow marker
}

const handleSimulationStepChange = (stepIndex: number, distanceToStep: number) => {
  // 1. Update current step index
  // 2. Update distance to step
  // 3. Trigger UI updates
}

const handleSimulationArrival = () => {
  // 1. Show arrival message
  // 2. Calculate trip statistics
  // 3. Clean up simulation
  // 4. Clear route
}
```

## Integration Points

### Map Integration

```typescript
// Create simulated marker
const el = document.createElement('div');
// Style as blue circle with arrow
simulatedMarkerRef.current = new maplibregl.Marker({ 
  element: el, 
  rotationAlignment: 'map' 
})
  .setLngLat(position)
  .addTo(map.current);

// Update marker
simulatedMarkerRef.current.setLngLat(position);
simulatedMarkerRef.current.setRotation(bearing);

// Follow marker with map
map.current.easeTo({
  center: position,
  bearing: bearing,
  duration: 100,
});
```

### Voice Integration

```typescript
if ('speechSynthesis' in window) {
  const utterance = new SpeechSynthesisUtterance();
  utterance.text = "Через 50 метров поверните налево";
  utterance.lang = 'ru-RU';
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}
```

## Performance Considerations

1. **Update Frequency**: Position updates every 100ms for smooth animation
2. **Map Updates**: Use `easeTo()` instead of `flyTo()` for smoother following
3. **Voice Throttling**: Prevent duplicate announcements with `lastAnnouncedStepRef`
4. **Cleanup**: Always remove markers and clear intervals on unmount

## Testing Scenarios

### Basic Flow
1. Select station
2. Build route
3. Start test-drive
4. Observe movement
5. Check voice announcements
6. Verify step changes
7. Test pause/resume
8. Test reset
9. Complete journey

### Edge Cases
- Route with single step
- Very short route (<100m)
- Very long route (>50km)
- Route with many turns
- Pause at turn point
- Speed change during movement
- Exit during movement

## Browser Compatibility

### Required APIs
- ✅ Geolocation API (for real navigation)
- ✅ Web Speech API (for voice, optional)
- ✅ MapLibre GL JS
- ✅ ES6+ features

### Known Issues
- Safari iOS: Speech API may not work
- Firefox: Speech voices may differ
- Mobile: Performance may vary

## Future Enhancements

### High Priority
- [ ] Add traffic simulation
- [ ] Improve turn detection algorithm
- [ ] Add alternative routes
- [ ] Save simulation history

### Medium Priority
- [ ] Export route to GPX
- [ ] Share route link
- [ ] Offline map support
- [ ] Custom voice settings

### Low Priority
- [ ] 3D building visualization
- [ ] Street view integration
- [ ] Weather overlay
- [ ] Speed limit warnings

## Debugging

### Enable Debug Logs

```typescript
// In NavigationSimulator.tsx
console.log('Position:', position);
console.log('Bearing:', bearing);
console.log('Current step:', stepIndex);
console.log('Distance to step:', distanceToStep);
```

### Common Issues

**Issue:** Marker not moving
- Check `isActive` prop
- Verify `routeCoordinates` not empty
- Check `speed` value

**Issue:** Voice not working
- Check browser support
- Verify `speechSynthesis` available
- Check audio permissions

**Issue:** Steps not changing
- Verify step distance calculation
- Check `onStepChange` callback
- Review accumulated distance logic

## Code Style

- Use TypeScript strict mode
- Follow React hooks best practices
- Clean up effects and intervals
- Use meaningful variable names
- Add comments for complex logic

## Dependencies

```json
{
  "maplibre-gl": "^3.x",
  "react": "^18.x",
  "react-modal-sheet": "^2.x",
  "lucide-react": "^0.x"
}
```

## API Usage

### OSRM API
- Endpoint: `https://router.project-osrm.org/route/v1/driving/`
- Parameters: `overview=full&geometries=geojson&steps=true`
- Rate limit: Public instance, use responsibly

## License

Same as main project
