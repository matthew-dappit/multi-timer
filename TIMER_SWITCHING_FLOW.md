# Timer Switching Flow Explanation

## Your Scenario
**You start Timer A → switch to Timer B → back to A → back to B → leave B running**

Let me walk through exactly what happens at each step.

---

## Initial State
```
Timer A: elapsed = 0, isActive = false
Timer B: elapsed = 0, isActive = false
activeTimerId = null
```

---

## Step 1: Start Timer A

### What You Do
Click "Start" on Timer A

### What Happens in MultiTimer.tsx

1. **`handleTimerStart("group1", "timerA")` is called**
   ```tsx
   const key = timerKey(groupId, timerId);  // "group1:timerA"
   setActiveTimerId(key);                    // Sets activeTimerId to "group1:timerA"
   
   const currentElapsed = findTimerElapsed(groupId, timerId);  // 0
   persistRunningSession({
     groupId: "group1",
     timerId: "timerA",
     startedAt: Date.now(),              // e.g., 1727712000000
     elapsedWhenStarted: 0
   });
   ```

2. **Timer A receives new props:**
   - `isActive = true` (because `activeTimerId === "group1:timerA"`)
   - `elapsed = 0`

### What Happens in Timer.tsx (Timer A)

3. **useEffect detects `isActive` changed to `true`:**
   ```tsx
   // Timer A starts counting
   startTimeRef.current = Date.now();        // 1727712000000
   elapsedAtStartRef.current = 0;            // Current elapsed
   
   intervalRef.current = setInterval(() => {
     const now = Date.now();                 // e.g., 1727712001000 (1 sec later)
     const secondsPassed = Math.floor(
       (now - startTimeRef.current!) / 1000  // (1727712001000 - 1727712000000) / 1000 = 1
     );
     const newElapsed = 0 + 1;               // 1 second
     onElapsedChange(id, 1);                 // Updates parent
   }, 1000);
   ```

### Result After 10 Seconds
```
Timer A: elapsed = 10, isActive = true, interval running
Timer B: elapsed = 0, isActive = false
activeTimerId = "group1:timerA"
```

---

## Step 2: Switch to Timer B (10 seconds later)

### What You Do
Click "Start" on Timer B

### What Happens in MultiTimer.tsx

1. **`handleTimerStart("group1", "timerB")` is called**
   ```tsx
   const key = timerKey(groupId, timerId);  // "group1:timerB"
   setActiveTimerId(key);                    // Changes activeTimerId to "group1:timerB"
   
   const currentElapsed = findTimerElapsed(groupId, timerId);  // 0
   persistRunningSession({
     groupId: "group1",
     timerId: "timerB",
     startedAt: Date.now(),              // e.g., 1727712010000
     elapsedWhenStarted: 0
   });
   ```

2. **React re-renders all timers with new props:**
   - **Timer A receives:** `isActive = false` (activeTimerId is now "group1:timerB")
   - **Timer B receives:** `isActive = true` (activeTimerId === "group1:timerB")

### What Happens in Timer.tsx (Timer A)

3. **Timer A's useEffect detects `isActive` changed to `false`:**
   ```tsx
   // Clean up interval when timer stops
   if (intervalRef.current) {
     clearInterval(intervalRef.current);     // STOPS the interval
     intervalRef.current = null;
   }
   startTimeRef.current = null;              // Clears start time
   ```
   
   **Important:** Timer A's `elapsed` stays at 10 seconds and is preserved in state!

### What Happens in Timer.tsx (Timer B)

4. **Timer B's useEffect detects `isActive` changed to `true`:**
   ```tsx
   // Timer B starts counting
   startTimeRef.current = Date.now();        // 1727712010000
   elapsedAtStartRef.current = 0;            // Current elapsed
   
   intervalRef.current = setInterval(() => {
     const now = Date.now();
     const secondsPassed = Math.floor(
       (now - startTimeRef.current!) / 1000
     );
     const newElapsed = 0 + secondsPassed;
     onElapsedChange(id, newElapsed);
   }, 1000);
   ```

### Result After Timer B Runs 5 Seconds
```
Timer A: elapsed = 10, isActive = false, interval stopped
Timer B: elapsed = 5, isActive = true, interval running
activeTimerId = "group1:timerB"
```

---

## Step 3: Back to Timer A (5 seconds later)

### What You Do
Click "Start" on Timer A

### What Happens in MultiTimer.tsx

1. **`handleTimerStart("group1", "timerA")` is called**
   ```tsx
   setActiveTimerId("group1:timerA");        // Changes back to Timer A
   
   const currentElapsed = findTimerElapsed(groupId, timerId);  // 10 (preserved!)
   persistRunningSession({
     groupId: "group1",
     timerId: "timerA",
     startedAt: Date.now(),              // e.g., 1727712015000
     elapsedWhenStarted: 10              // ← Picks up where it left off!
   });
   ```

2. **React re-renders:**
   - **Timer A receives:** `isActive = true`, `elapsed = 10`
   - **Timer B receives:** `isActive = false`, `elapsed = 5`

### What Happens in Timer.tsx

3. **Timer B stops (useEffect with `isActive = false`):**
   ```tsx
   clearInterval(intervalRef.current);       // Timer B stops at 5 seconds
   ```

4. **Timer A resumes (useEffect with `isActive = true`):**
   ```tsx
   startTimeRef.current = Date.now();        // 1727712015000 (new start time)
   elapsedAtStartRef.current = 10;           // ← Continues from 10 seconds!
   
   intervalRef.current = setInterval(() => {
     const now = Date.now();                 // e.g., 1727712016000
     const secondsPassed = Math.floor(
       (now - startTimeRef.current!) / 1000  // (1727712016000 - 1727712015000) / 1000 = 1
     );
     const newElapsed = 10 + 1;              // 11 seconds (continuing from 10!)
     onElapsedChange(id, 11);
   }, 1000);
   ```

### Result After Timer A Runs Another 3 Seconds
```
Timer A: elapsed = 13, isActive = true, interval running
Timer B: elapsed = 5, isActive = false, interval stopped
activeTimerId = "group1:timerA"
```

---

## Step 4: Back to Timer B Again (3 seconds later)

Same process as Step 3, but reversed:

1. **MultiTimer sets `activeTimerId = "group1:timerB"`**
2. **Timer A stops, preserving elapsed = 13**
3. **Timer B resumes from elapsed = 5:**
   ```tsx
   startTimeRef.current = Date.now();
   elapsedAtStartRef.current = 5;        // Picks up where it left off
   ```

### Result After Timer B Runs Another 7 Seconds
```
Timer A: elapsed = 13, isActive = false
Timer B: elapsed = 12, isActive = true
activeTimerId = "group1:timerB"
```

---

## Step 5: Leave Timer B Running

Timer B continues running indefinitely:
- Every second, its interval fires
- Calculates `secondsPassed` from `Date.now() - startTimeRef.current`
- Updates elapsed: `5 + secondsPassed`
- **Even if tab goes inactive**, the timestamp calculation ensures accuracy

If you refresh the page:
- SessionStorage contains Timer B's running session
- On hydration, it calculates how much time passed since `startedAt`
- Resumes Timer B with accurate elapsed time

---

## Key Mechanisms That Make This Work

### 1. **Single Source of Truth: `activeTimerId`**
```tsx
// Only ONE timer can have activeTimerId at a time
setActiveTimerId("group1:timerA");  // All other timers become inactive
```

### 2. **Elapsed Time Preservation**
```tsx
// When Timer A stops, its elapsed value stays in state
Timer A: { elapsed: 10 }  // Preserved even when inactive
```

### 3. **Resume from Last Position**
```tsx
// When restarting, uses current elapsed as baseline
elapsedAtStartRef.current = elapsed;  // 10, 13, 5, etc.
```

### 4. **Timestamp-Based Counting**
```tsx
// Doesn't rely on interval reliability
const secondsPassed = Math.floor((Date.now() - startTimeRef.current) / 1000);
const newElapsed = elapsedAtStartRef.current + secondsPassed;
```

### 5. **React's Automatic Prop Updates**
```tsx
// When activeTimerId changes, ALL timers re-render with new isActive values
<Timer isActive={activeTimerId === "group1:timerA"} />  // true or false
<Timer isActive={activeTimerId === "group1:timerB"} />  // true or false
```

---

## Final State Summary

After your complete scenario:

```
Timer A: 
  - Total elapsed: 13 seconds (10 seconds first run + 3 seconds second run)
  - Currently: STOPPED
  - Ready to resume from 13 seconds if restarted

Timer B:
  - Total elapsed: 12+ seconds (5 seconds first run + 7+ seconds ongoing)
  - Currently: RUNNING
  - Continues counting accurately even in inactive tab

Daily Total: 25+ seconds (sum of Timer A + Timer B)
```

---

## What Happens During Edge Cases

### If You Close the Browser
- **sessionStorage** preserves the running session for Timer B
- On reopen, it calculates `Date.now() - startedAt` and resumes accurately

### If You Refresh the Page
- Same as above - Timer B resumes from correct time

### If Tab Is Inactive for 30 Minutes
- Timer B's interval may fire slowly (throttled)
- But each tick recalculates from `Date.now()`, so time is accurate
- When you return, it shows the correct elapsed time

### If You Start Timer C While B Is Running
- Timer B automatically stops (becomes `isActive = false`)
- Timer B's elapsed time is preserved
- Timer C starts from 0

---

## The Beauty of This Design

1. **Exclusive operation** is handled by a single state variable (`activeTimerId`)
2. **Time preservation** happens naturally because React keeps `elapsed` in state
3. **Resumption** works automatically by using `elapsed` as the baseline
4. **Accuracy** is guaranteed by timestamp-based calculation, not interval counting

This is a clean, React-idiomatic solution that handles all edge cases elegantly! 🎯
