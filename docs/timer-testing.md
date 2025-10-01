# Timer Functionality Test Plan

## Changes Made

### Issue Identified
The timer start/stop logic had a race condition where:
1. `activeTimerId` was set to `null` 
2. Then immediately set to a new value
3. This caused React to render with `null` in between, making both timers appear inactive

### Fixes Applied

1. **Atomic State Updates in `handleTimerStart`**:
   - Combined the stop-current-timer and start-new-timer logic into a single `setTimeEvents` call
   - Removed the intermediate `setActiveTimerId(null)` call
   - Updates `activeEventIdRef` immediately within the state update function

2. **Improved `handleTimerStop`**:
   - Added validation to ensure we're stopping the correct timer
   - Uses consistent timestamp (`now`) for all operations
   - Clearer error handling

3. **Debug Logging**:
   - Added `useEffect` to log active timer changes in console
   - Helps track state transitions during development

## Test Scenarios

### Scenario 1: Start a Single Timer
**Steps:**
1. Open http://localhost:3001
2. Click "Start" on any timer
3. **Expected:** Timer shows "Running" status with green dot, button turns coral
4. **Expected:** Time starts incrementing every second
5. Check console: Should see "Active Timer Changed: group:timer"

### Scenario 2: Stop a Running Timer
**Steps:**
1. Start a timer (from Scenario 1)
2. Let it run for ~5 seconds
3. Click "Stop" button
4. **Expected:** Timer shows "Idle" status with gray dot, button turns teal
5. **Expected:** Time stops incrementing but retains the elapsed time
6. Check console: Should see "Active Timer Changed: null"

### Scenario 3: Switch Between Timers (CRITICAL TEST)
**Steps:**
1. Start Timer A in Project 1
2. Let it run for ~5 seconds
3. Start Timer B in Project 1 (or any project)
4. **Expected:** 
   - Timer A should automatically stop and show "Idle"
   - Timer B should show "Running"
   - ONLY Timer B has green dot and coral button
   - Timer A elapsed time is preserved
5. Check console: Should see two "Active Timer Changed" logs

### Scenario 4: Multiple Timers in Sequence
**Steps:**
1. Create 3 timers (add timers to existing project or create new projects)
2. Start Timer 1, wait 3 seconds
3. Start Timer 2, wait 3 seconds  
4. Start Timer 3, wait 3 seconds
5. Stop Timer 3
6. **Expected:** 
   - Each timer accumulated ~3 seconds of time
   - All timers now show "Idle"
   - No timer appears active

### Scenario 5: Page Refresh Persistence
**Steps:**
1. Start a timer
2. Let it run for ~5 seconds
3. Refresh the page (Cmd+R / Ctrl+R)
4. **Expected:**
   - Timer continues running after refresh
   - Time continues from where it left off (may have a small gap due to refresh)
   - Timer still shows "Running" status

### Scenario 6: Navigate Away and Back
**Steps:**
1. Start a timer
2. Navigate to /insights page
3. Navigate back to home (/)
4. **Expected:**
   - Timer continues running
   - Time accumulated during navigation shows correctly

### Scenario 7: Compact Mode Switching
**Steps:**
1. Start a timer
2. Click "Compact Mode" button
3. **Expected:**
   - Timer still shows as active (visual ring indicator)
   - Timer still running
4. Click "Exit Compact" button
5. **Expected:**
   - Returns to normal view with "Running" status visible

### Scenario 8: Browser Tab Throttling (Important!)
**Steps:**
1. Start a timer
2. Switch to a different tab or minimize browser
3. Wait 60 seconds (1 minute)
4. Return to the tab
5. **Expected:**
   - Timer shows ~60 seconds of elapsed time (accurate)
   - Timer still running
   - Time catches up immediately (no drift)

## Debug Console Output

When timers work correctly, you should see these console logs:

```
Active Timer Changed: group_abc123:timer_xyz789
Active Event ID: event_123456
```

When stopping:
```
Active Timer Changed: null
Active Event ID: null
```

When switching timers:
```
Active Timer Changed: group_abc123:timer_new999
Active Event ID: event_new888
```

## Known Good Behaviors

✅ Only ONE timer can be active at a time
✅ Starting a new timer automatically stops the current one
✅ Elapsed time is calculated from events, not intervals
✅ Time survives browser throttling and page refreshes
✅ Visual indicators (green dot, coral button, ring) show active state
✅ localStorage persists all timer data

## Common Issues to Check

### Issue: Multiple timers appear active
**Solution:** Clear localStorage and refresh
```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Issue: Timer not starting
**Check:**
- Browser console for errors
- Network tab for any failed requests
- Console logs showing activeTimerId changes

### Issue: Time not incrementing
**Check:**
- Console shows active timer ID
- timeEvents array has event with endTime = null
- useEffect with 1-second interval is running

## localStorage Keys

Check these in browser DevTools > Application > Local Storage:

- `multi-timer/state` - Groups and timer structure
- `multi-timer/time-events` - Event history (for analytics)

Check Session Storage:
- `multi-timer/running` - Currently running session (survives refresh)

## Success Criteria

All tests pass if:
1. ✅ Scenario 3 (switch between timers) works perfectly - NO multiple active timers
2. ✅ Time accuracy maintained after browser throttling
3. ✅ State persists across page refreshes
4. ✅ Console shows correct activeTimerId transitions
5. ✅ Visual indicators match actual running state
