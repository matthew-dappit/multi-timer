# Architecture Documentation

## System Overview

Multi-Timer uses a client-side React architecture with TypeScript, featuring event-based time tracking and persistent state management.

## Core Architecture Principles

1. **Event-Based Time Tracking** - Store timestamps, calculate elapsed time
2. **Immutable State Updates** - Pure functions for state transformations
3. **LocalStorage as Source of Truth** - All data persisted locally
4. **Component Isolation** - Clear separation of concerns

---

## Component Hierarchy

```
App Layout (AuthProvider)
├── Navbar (User info, Logout)
└── ProtectedRoute
    └── MultiTimer (State Management)
        └── Timer Groups
            ├── Project Name Input
            ├── Group Controls (Add Timer, Remove Group)
            └── Timer Grid
                └── Timer (Display & Controls)
                    ├── Status Indicator
                    ├── Task Name Input
                    ├── Time Display
                    ├── Notes Textarea
                    └── Start/Stop Button
```

---

## Time Event System

### The Problem We Solved

**Original Issue**: Timer showed 4:43 when real time was 20:06

**Root Cause**: The `handleElapsedChange` function was resetting `startedAt` every second:
```typescript
// BAD - This reset the reference point constantly
persistRunningSession({
  startedAt: Date.now(),  // ❌ New timestamp every second!
  elapsedWhenStarted: newElapsed,
});
```

### The Solution: Event-Based Tracking

Instead of incrementing counters, we store **time events**:

```typescript
interface TimeEvent {
  id: string;
  groupId: string;
  timerId: string;
  startTime: number;       // Unix timestamp (ms)
  endTime: number | null;  // null if currently running
  taskName: string;        // Snapshot at event creation
  projectName: string;     // Snapshot at event creation
}
```

### How It Works

#### 1. Starting a Timer

```typescript
const handleTimerStart = (groupId: string, timerId: string) => {
  // Stop any currently running timer
  if (activeEventIdRef.current) {
    setTimeEvents(prev =>
      prev.map(event =>
        event.id === activeEventIdRef.current
          ? {...event, endTime: Date.now()}
          : event
      )
    );
  }

  // Create new time event
  const newEvent: TimeEvent = {
    id: createId(),
    groupId,
    timerId,
    startTime: Date.now(),  // ✅ Set once and never changed
    endTime: null,
    taskName: timer?.taskName || "",
    projectName: group?.projectName || "",
  };

  setTimeEvents(prev => [...prev, newEvent]);
  activeEventIdRef.current = newEvent.id;
};
```

#### 2. Calculating Elapsed Time

```typescript
const calculateElapsedFromEvents = (
  events: TimeEvent[],
  groupId: string,
  timerId: string,
  currentTime: number = Date.now()
): number => {
  const relevantEvents = events.filter(
    e => e.groupId === groupId && e.timerId === timerId
  );

  let totalSeconds = 0;

  for (const event of relevantEvents) {
    // Use currentTime if event is still running
    const endTime = event.endTime ?? currentTime;
    const duration = Math.floor((endTime - event.startTime) / 1000);
    totalSeconds += duration;
  }

  return totalSeconds;
};
```

#### 3. Continuous Updates

```typescript
// Recalculate elapsed time every second for running timers
useEffect(() => {
  if (!activeTimerId) return;

  const interval = setInterval(() => {
    const now = Date.now();
    setGroups(prev =>
      prev.map(group => ({
        ...group,
        timers: group.timers.map(timer => ({
          ...timer,
          elapsed: calculateElapsedFromEvents(
            timeEvents,
            group.id,
            timer.id,
            now
          ),
        })),
      }))
    );
  }, 1000);

  return () => clearInterval(interval);
}, [activeTimerId, timeEvents]);
```

### Why This Works

| Aspect | Old System | New System |
|--------|-----------|------------|
| **Accuracy** | ❌ Lost time during throttling | ✅ Uses actual timestamps |
| **Reference Point** | ❌ Reset every update | ✅ Set once at start |
| **Browser Throttling** | ❌ Affected by inactive tabs | ✅ Immune to throttling |
| **Audit Trail** | ❌ No history | ✅ Complete session history |
| **Analytics** | ❌ Not possible | ✅ Foundation for charts |

---

## State Management

### Timer State

```typescript
interface TimerData {
  id: string;
  taskName: string;
  notes: string;
  elapsed: number;  // Calculated from timeEvents
}

interface TimerGroup {
  id: string;
  projectName: string;
  timers: TimerData[];
}
```

### Running Session Tracking

```typescript
interface RunningSession {
  groupId: string;
  timerId: string;
  startedAt: number;  // Reference timestamp
}

// Stored in sessionStorage for persistence across refreshes
const runningSessionRef = useRef<RunningSession | null>(null);
const activeEventIdRef = useRef<string | null>(null);
```

### State Flow Diagram

```
User Action
    ↓
Event Handler (handleTimerStart/Stop)
    ↓
Update TimeEvents State
    ↓
Persist to LocalStorage
    ↓
Recalculation Effect Triggers
    ↓
Calculate New Elapsed Times
    ↓
Update Groups State
    ↓
Persist Groups to LocalStorage
    ↓
Re-render UI
```

---

## Storage Strategy

### LocalStorage Keys

```typescript
const STORAGE_KEY = "multi-timer/state";           // Groups and timers
const TIME_EVENTS_KEY = "multi-timer/time-events"; // Time events
const RUNNING_SESSION_KEY = "multi-timer/running"; // Active session (sessionStorage)
```

### Storage Schema

#### Timer Groups and Timers
```json
{
  "groups": [
    {
      "id": "group-1",
      "projectName": "Client A",
      "timers": [
        {
          "id": "timer-1",
          "taskName": "Feature Development",
          "notes": "Working on time tracking",
          "elapsed": 9240
        }
      ]
    }
  ],
  "isCompact": false
}
```

#### Time Events
```json
[
  {
    "id": "event-1",
    "groupId": "group-1",
    "timerId": "timer-1",
    "startTime": 1696176000000,
    "endTime": 1696179600000,
    "taskName": "Feature Development",
    "projectName": "Client A"
  },
  {
    "id": "event-2",
    "groupId": "group-1",
    "timerId": "timer-1",
    "startTime": 1696180000000,
    "endTime": null,
    "taskName": "Feature Development",
    "projectName": "Client A"
  }
]
```

### Hydration Process

On app load:

1. **Load time events** from `TIME_EVENTS_KEY`
2. **Filter to today's events** using `filterTodayEvents()`
3. **Load timer groups** from `STORAGE_KEY`
4. **Recalculate elapsed times** from filtered events
5. **Check for running session** in sessionStorage
6. **Resume running timer** if found and valid
7. **Set up recalculation interval** for active timers

```typescript
useEffect(() => {
  // Load events
  const storedEvents = localStorage.getItem(TIME_EVENTS_KEY);
  let loadedEvents = storedEvents ? JSON.parse(storedEvents) : [];
  loadedEvents = filterTodayEvents(loadedEvents);

  // Load groups
  const storedGroups = localStorage.getItem(STORAGE_KEY);
  let nextGroups = storedGroups ? JSON.parse(storedGroups).groups : [];

  // Recalculate elapsed times
  const now = Date.now();
  nextGroups = nextGroups.map(group => ({
    ...group,
    timers: group.timers.map(timer => ({
      ...timer,
      elapsed: calculateElapsedFromEvents(loadedEvents, group.id, timer.id, now),
    })),
  }));

  setGroups(nextGroups);
  setTimeEvents(loadedEvents);
  hasHydrated.current = true;
}, []);
```

### Data Cleanup

Events are filtered to only include today's data:

```typescript
const filterTodayEvents = (events: TimeEvent[]): TimeEvent[] => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  return events.filter(event => event.startTime >= todayStartMs);
};
```

This prevents unbounded growth of localStorage data.

---

## Authentication System

### Architecture

```
AuthContext (Provider)
    ├── Login/Signup Forms
    ├── ProtectedRoute Wrapper
    └── API Request Utilities
```

### Token Management

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => void;
}

// Token stored in localStorage
localStorage.setItem('auth_token', token);
localStorage.setItem('user', JSON.stringify(user));
```

### Protected Routes

```typescript
<ProtectedRoute fallback={<AuthForm />}>
  <MultiTimer />
</ProtectedRoute>
```

If not authenticated, shows login form instead of app content.

---

## Performance Considerations

### Current Scale
- **Timers**: Efficiently handles 100+ timers
- **Events per day**: ~50-100 sessions typical
- **Storage**: ~5-10 KB per day
- **Calculation**: O(n) where n = events per timer (~5-10 typically)

### Optimization Strategies

#### 1. Memoization
```typescript
const timerTotals = useMemo(() => {
  return groups.map(group => ({
    groupId: group.id,
    total: group.timers.reduce((sum, t) => sum + t.elapsed, 0)
  }));
}, [groups]);
```

#### 2. Selective Recalculation
Only recalculate elapsed time for timers in groups with active sessions, not all timers.

#### 3. Debounced Persistence
```typescript
const debouncedPersist = useMemo(
  () => debounce((data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, 500),
  []
);
```

### Future Scaling

When history grows large (>1000 events):
- **Archive old events** to IndexedDB or backend
- **Lazy load** historical data on demand
- **Implement pagination** for event viewing
- **Add date range filters** for reports

---

## Component Responsibilities

### MultiTimer.tsx
**Role**: State management and persistence

- Manages all timer groups and timers
- Handles time event creation/completion
- Calculates elapsed times from events
- Persists to localStorage
- Coordinates timer start/stop actions

### Timer.tsx
**Role**: Pure presentation component

- Displays timer state (time, name, notes)
- Provides UI controls (start/stop buttons)
- Emits events to parent (onStart, onStop)
- No internal state management
- No direct storage access

### AuthContext.tsx
**Role**: Authentication state provider

- Manages user login state
- Stores authentication tokens
- Provides login/signup/logout functions
- Verifies tokens on app load

### ProtectedRoute.tsx
**Role**: Route protection

- Checks authentication status
- Shows loading state during check
- Renders fallback for unauthenticated users
- Allows authenticated access

---

## Design Patterns

| Pattern | Implementation | Benefit |
|---------|---------------|---------|
| **Event Sourcing** | TimeEvent history | Audit trail, recalculable state |
| **Container/Presenter** | MultiTimer/Timer split | Separation of concerns |
| **Provider Pattern** | AuthContext | Global auth state |
| **Compound Components** | TimerGroup + Timer | Composition |
| **Custom Hooks** | useLocalStorage (future) | Reusable logic |
| **Optimistic Updates** | Update UI immediately | Better UX |

---

## Testing Strategy

### Unit Tests
- `calculateElapsedFromEvents()` - Verify time calculations
- `filterTodayEvents()` - Ensure date filtering works
- Timer formatting functions

### Integration Tests
- Start timer → creates TimeEvent
- Stop timer → sets endTime
- Refresh page → state restored
- Switch timers → previous stops, new starts

### Accuracy Tests
1. Start timer, wait 60s, verify elapsed = 60s
2. Start timer, switch tabs 5min, return, verify accuracy
3. Start timer, refresh page, verify resumes correctly

---

**Last Updated**: October 1, 2025
