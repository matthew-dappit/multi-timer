# Timer Accuracy Fix - Time Event Implementation

## Problem
Timer was showing ~4:43 when real time elapsed was ~20:06. The timer was losing significant time, likely due to browser tab throttling and the way elapsed time was being recalculated.

## Root Cause
The previous implementation had a critical flaw where `handleElapsedChange` was calling `persistRunningSession` with a new `startedAt` timestamp every second. This constantly reset the reference point, causing cumulative time loss.

## Solution: Event-Based Time Tracking

Instead of storing a running counter, we now store **time events** - records of when each timer started and stopped.

### New Data Structure
```typescript
interface TimeEvent {
  id: string;
  groupId: string;
  timerId: string;
  startTime: number;       // Timestamp when started
  endTime: number | null;  // Timestamp when stopped (null if running)
  taskName: string;        // Snapshot at event time
  projectName: string;     // Snapshot at event time
}
```

### How Elapsed Time is Calculated
```typescript
// Sum up all the event durations for a timer
const calculateElapsedFromEvents = (events, groupId, timerId, currentTime) => {
  let totalSeconds = 0;
  
  for (const event of events) {
    if (event.groupId === groupId && event.timerId === timerId) {
      const endTime = event.endTime ?? currentTime; // Use current time if running
      const duration = Math.floor((endTime - event.startTime) / 1000);
      totalSeconds += duration;
    }
  }
  
  return totalSeconds;
};
```

## Key Changes

### 1. MultiTimer.tsx
- Added `TimeEvent` interface and related types
- Added `timeEvents` state to store all time events
- Added helper functions: `calculateElapsedFromEvents`, `filterTodayEvents`
- Modified `handleTimerStart`: Creates new TimeEvent instead of just updating state
- Modified `handleTimerStop`: Closes TimeEvent by setting endTime
- Removed `handleElapsedChange` logic that was resetting startedAt
- Added effect to recalculate elapsed times from events every second
- Events are persisted to localStorage under `"multi-timer/time-events"`

### 2. Timer.tsx
- Simplified component - removed all interval and ref logic
- Timer is now a pure presentational component
- Elapsed time comes from parent (calculated from events)
- No longer manages its own timing - just displays and handles start/stop clicks

### 3. RunningSession Interface
- Removed `elapsedWhenStarted` property (no longer needed)
- Now only stores: `groupId`, `timerId`, `startedAt`

## Why This Fixes the Accuracy Issue

### Before (Broken)
```typescript
// Every second, this would reset the start time!
if (activeTimerId === timerKey(groupId, timerId)) {
  persistRunningSession({
    startedAt: Date.now(),  // ❌ Always current time
    elapsedWhenStarted: newElapsed,
  });
}
```

### After (Fixed)
```typescript
// Start time is set ONCE when timer starts
persistRunningSession({
  startedAt: Date.now(),  // ✅ Only set on start
});

// Elapsed is calculated from this fixed point
const elapsed = calculateElapsedFromEvents(events, groupId, timerId, Date.now());
```

## Benefits

### Immediate
1. **Perfect Accuracy**: Time calculated from actual timestamps, immune to browser throttling
2. **Resilient**: Works correctly even if tab is inactive for hours
3. **Reliable**: No cumulative errors from interval drift

### Future-Ready
1. **Analytics**: Can generate charts showing when you worked
2. **History**: Complete audit trail of all work sessions
3. **Editing**: Could add ability to correct past sessions
4. **Reporting**: Export time logs to CSV, integrate with billing systems

## Testing the Fix

1. **Basic accuracy**: Start a timer, wait 60 seconds, verify it shows 00:01:00
2. **Tab switching**: Start timer, switch to another tab for 5+ minutes, return - should be accurate
3. **Page refresh**: Start timer, refresh page - should resume with correct time
4. **Multiple timers**: Start timer A, switch to B, verify A stops and B starts correctly
5. **Overnight test**: Leave timer running overnight, check if time matches real elapsed time

## Migration Notes

- Old timers with elapsed time will continue to work
- First time a timer starts after this update, it creates its first TimeEvent
- Events are filtered to only keep today's data on load (prevents unbounded growth)
- Old localStorage format (`elapsed` in timer object) is still respected until timer is used

## Future Enhancements

See `TIME_EVENT_SYSTEM.md` for detailed future roadmap including:
- Analytics dashboard with charts
- Export to CSV/JSON
- Event editing capability
- Multi-day history view
- Break detection and suggestions

## Files Modified

1. `/src/components/MultiTimer.tsx` - Major refactor to use events
2. `/src/components/Timer.tsx` - Simplified to pure presentation
3. `/TIME_EVENT_SYSTEM.md` - New comprehensive documentation
4. `/TIMER_ACCURACY_FIX_V2.md` - This file

## Date
September 30, 2025
