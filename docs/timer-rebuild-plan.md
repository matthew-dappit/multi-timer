# Timer Logic Rebuild Plan

**Branch:** `feat/timer-logic-rebuild`  
**Date:** October 1, 2025  
**Status:** Ready for new implementation

## What Was Removed

All timekeeping logic has been stripped out of the application. The following was removed:

### From MultiTimer.tsx

1. **Time Event System**
   - `TimeEvent` interface (event-based tracking)
   - `RunningSession` interface
   - `timeEvents` state
   - `activeTimerId` state
   - `activeEventIdRef` ref
   - `runningSessionRef` ref
   - `hasHydrated` ref

2. **Time Calculation Logic**
   - `calculateElapsedFromEvents()` function
   - `getTodayKey()` helper
   - `filterTodayEvents()` helper
   - Elapsed time recalculation interval effect

3. **Storage Keys**
   - `RUNNING_SESSION_KEY` constant
   - `TIME_EVENTS_KEY` constant
   - Time events persistence logic
   - Running session persistence logic

4. **Timer Control Functions**
   - `handleTimerStart()` - started timers and created time events
   - `handleTimerStop()` - stopped timers and ended time events
   - `handleElapsedChange()` - updated elapsed time
   - `persistTimeEvents()` - saved time events to localStorage
   - `persistRunningSession()` - saved running session to sessionStorage

5. **Data Fields**
   - Removed `elapsed: number` from `TimerData` interface

### From Timer.tsx

1. **Props Removed**
   - `elapsed: number`
   - `onElapsedChange: (id: string, newElapsed: number) => void`
   - `onStart?: (id: string) => void`
   - `onStop?: (id: string) => void`
   - `isActive?: boolean`

2. **Logic Removed**
   - `formatTime()` function
   - `toggleTimer()` function
   - Active/inactive state visual indicators
   - Start/Stop button functionality (now disabled placeholder)

## What Was Kept

### UI Shell Components

1. **Project/Group Management**
   - Create new project groups
   - Remove project groups
   - Edit project names
   - Group visual layout

2. **Timer Management**
   - Add timers to groups
   - Remove timers from groups
   - Timer card layout
   - Grid responsive layout

3. **Input Fields**
   - Task name input
   - Notes textarea
   - All form controls

4. **Visual Design**
   - Tailwind CSS styling
   - Dappit brand colors
   - Compact/standard view toggle
   - Responsive grid layout
   - Dark mode support

5. **State Management**
   - Basic localStorage persistence for groups structure
   - `isCompact` view mode state
   - Project and timer CRUD operations

## Current State

- ✅ App compiles without errors
- ✅ UI renders correctly
- ✅ Project/group management works
- ✅ Timer creation/deletion works
- ✅ Input fields work (task name, notes, project name)
- ✅ Compact mode toggle works
- ✅ All styling intact
- ❌ Timer display shows "00:00:00" (placeholder)
- ❌ Start button is disabled (placeholder)
- ❌ No time tracking functionality

## Next Steps for Implementation

### Phase 1: Basic Timer Logic

1. Add back `elapsed` field to `TimerData` interface
2. Implement simple interval-based timer (for testing)
3. Add start/stop button functionality
4. Display elapsed time in UI

### Phase 2: Event-Based Tracking (Recommended)

1. Design new `TimeEvent` interface
2. Implement event creation on start
3. Implement event completion on stop
4. Calculate elapsed from events (timestamp-based)
5. Persist events to localStorage

### Phase 3: Advanced Features

1. Multi-timer support (only one active at a time)
2. Daily time totals
3. Timer history/analytics
4. Export functionality

## Storage Keys Still in Use

- `multi-timer/state` - Project groups, timers, isCompact mode

## Storage Keys Available for New Logic

- `multi-timer/running` - Previously used for running session
- `multi-timer/time-events` - Previously used for time events

## Testing Checklist

Before implementing new logic, verify:

- [x] App runs without errors
- [x] All UI elements render
- [x] Can create/delete projects
- [x] Can create/delete timers
- [x] Can edit task names and notes
- [x] Can toggle compact mode
- [x] LocalStorage persistence works for structure
- [x] Changes committed to git

## Design Considerations for New Logic

### Option 1: Pure Interval-Based
**Pros:** Simple, straightforward  
**Cons:** Browser throttling breaks it, not accurate

### Option 2: Timestamp-Based (Recommended)
**Pros:** Survives browser throttling, accurate  
**Cons:** Slightly more complex

### Option 3: Hybrid Approach
**Pros:** Best of both worlds  
**Cons:** More complex implementation

## References

- Original architecture docs: `docs/architecture.md`
- Previous implementation: See git history before commit a9d642a
- Development guide: `docs/development.md`
