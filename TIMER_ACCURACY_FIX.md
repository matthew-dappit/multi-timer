# Timer Accuracy Fix

## Problem Summary

**Reported Issue**: Timer was recording 1:19 instead of ~2:15 when the browser tab was not always active.

## Root Cause

The timer implementation in `Timer.tsx` had a critical flaw in its `useEffect` dependency array:

```tsx
// OLD CODE (BUGGY)
useEffect(() => {
  if (isActive) {
    intervalRef.current = setInterval(() => {
      onElapsedChange(id, elapsed + 1);
    }, 1000);
  } else {
    // cleanup...
  }
  return () => { /* cleanup */ };
}, [isActive, elapsed]); // ← elapsed as dependency caused the bug!
```

**Why this caused time loss:**

1. **Constant interval recreation**: Every second when `elapsed` changed, the entire effect would re-run
2. **Browser throttling**: When tabs are inactive, browsers throttle JavaScript execution
3. **Compounding effect**: Recreating intervals every second + browser throttling = significant time loss
4. **Missed ticks**: The timer would miss many seconds, especially in inactive tabs

## Solution Implemented

Changed the timer to use **timestamp-based calculation** instead of simple increment counting:

```tsx
// NEW CODE (FIXED)
useEffect(() => {
  if (isActive) {
    // Store the start time and elapsed time when timer starts
    startTimeRef.current = Date.now();
    elapsedAtStartRef.current = elapsed;
    
    intervalRef.current = setInterval(() => {
      // Calculate elapsed time based on actual time passed
      const now = Date.now();
      const secondsPassed = Math.floor((now - startTimeRef.current!) / 1000);
      const newElapsed = elapsedAtStartRef.current + secondsPassed;
      onElapsedChange(id, newElapsed);
    }, 1000);
  } else {
    // cleanup...
  }
  return () => { /* cleanup */ };
}, [isActive, id, onElapsedChange]); // ← elapsed removed from dependencies!
```

**Key improvements:**

1. **No more constant recreation**: Interval is only created/destroyed when timer starts/stops
2. **Timestamp-based accuracy**: Calculates elapsed time from actual wall-clock time
3. **Resilient to throttling**: Even if the interval fires late, it calculates the correct time
4. **Works with inactive tabs**: Time is based on `Date.now()`, not interval reliability

## Technical Details

### New Refs Added
- `startTimeRef`: Stores the timestamp when timer starts
- `elapsedAtStartRef`: Stores the elapsed seconds at timer start

### How It Works
1. When timer starts: Record current timestamp and existing elapsed time
2. Every interval tick: Calculate seconds passed since start using timestamps
3. Add seconds passed to the elapsed time at start
4. Update parent state with accurate time

### Why This Fixes The Issue
- **Before**: Timer relied on intervals firing exactly every 1000ms (unreliable in inactive tabs)
- **After**: Timer uses actual wall-clock time (always accurate regardless of tab state)

## Testing Recommendations

1. **Active tab test**: Start a timer and verify it counts accurately for several minutes
2. **Inactive tab test**: Start a timer, switch tabs for 5+ minutes, return and verify accuracy
3. **Multiple timer test**: Start timer A, switch to timer B, verify A stopped correctly
4. **Page refresh test**: Start a timer, refresh page, verify it resumes with correct time

## Expected Behavior Now

- Timer should track time **accurately** regardless of tab activity
- Time should be **preserved** across page refreshes (already implemented in MultiTimer.tsx)
- Starting a new timer should **stop** other timers (already implemented)
- All timers should contribute to the **daily total** correctly

## Date Fixed
September 30, 2025
