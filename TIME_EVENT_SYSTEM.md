# Time Event System Documentation

## Overview

The timer now uses a **time event-based architecture** instead of simple elapsed second counters. This provides perfect accuracy and enables future analytics features.

## Architecture

### Data Structure

```typescript
interface TimeEvent {
  id: string;              // Unique event ID
  groupId: string;         // Which project group
  timerId: string;         // Which timer within the group
  startTime: number;       // Timestamp when timer started (ms)
  endTime: number | null;  // Timestamp when timer stopped (null if running)
  taskName: string;        // Snapshot of task name at event time
  projectName: string;     // Snapshot of project name at event time
}
```

### How It Works

1. **Timer Start**: Creates a new `TimeEvent` with `endTime: null`
2. **Timer Stop**: Sets `endTime` to current timestamp
3. **Elapsed Calculation**: Sums all event durations for a timer
4. **Active Timer**: Uses `Date.now()` as end time for running events

## Key Benefits

### 1. Perfect Accuracy
- **Problem Solved**: Browser throttling of inactive tabs
- **How**: Elapsed time calculated from actual timestamps, not interval ticks
- **Result**: Timer shows exactly how much real time has passed

### 2. Audit Trail
- Complete history of when work happened
- Can reconstruct any timer's history
- Enables editing/correcting past sessions

### 3. Future Analytics (Ready to Implement)

#### Time-of-Day Heatmap
```typescript
// Example: Show productive hours
const getHourlyDistribution = (events: TimeEvent[]) => {
  const hourCounts = Array(24).fill(0);
  events.forEach(event => {
    const hour = new Date(event.startTime).getHours();
    const duration = (event.endTime || Date.now()) - event.startTime;
    hourCounts[hour] += duration;
  });
  return hourCounts;
};
```

#### Daily/Weekly Charts
```typescript
// Example: Time tracked per day
const getDailyTotals = (events: TimeEvent[]) => {
  const dailyMap = new Map<string, number>();
  events.forEach(event => {
    const date = new Date(event.startTime).toDateString();
    const duration = (event.endTime || Date.now()) - event.startTime;
    dailyMap.set(date, (dailyMap.get(date) || 0) + duration);
  });
  return dailyMap;
};
```

#### Project/Task Breakdown
```typescript
// Example: Time per project
const getProjectBreakdown = (events: TimeEvent[]) => {
  const projectMap = new Map<string, number>();
  events.forEach(event => {
    const duration = (event.endTime || Date.now()) - event.startTime;
    projectMap.set(
      event.projectName, 
      (projectMap.get(event.projectName) || 0) + duration
    );
  });
  return projectMap;
};
```

#### Session Statistics
- Average session length
- Number of sessions per day
- Identify work patterns (do you work in short bursts or long sessions?)
- Time between sessions (break duration)

## Implementation Details

### Storage

**Location**: `localStorage` under key `"multi-timer/time-events"`

**Filtering**: Only today's events are loaded on startup (filtered by date)

**Cleanup Strategy**: 
- Current: Keep only today's events in memory
- Future: Implement periodic archival to separate storage/database

### State Management

```typescript
// Main state
const [timeEvents, setTimeEvents] = useState<TimeEvent[]>([]);

// Active event tracking
const activeEventIdRef = useRef<string | null>(null);

// Calculation
const elapsed = calculateElapsedFromEvents(
  timeEvents, 
  groupId, 
  timerId, 
  Date.now()
);
```

### Update Flow

1. **User clicks Start**:
   - Stop any running event (set `endTime`)
   - Create new event with `startTime: Date.now()`
   - Store event ID in `activeEventIdRef`

2. **Every Second** (while timer active):
   - Recalculate elapsed from events
   - Update UI (no event modification needed)

3. **User clicks Stop**:
   - Find active event by ID
   - Set `endTime: Date.now()`
   - Clear `activeEventIdRef`

### Migration from Old System

On first load with the new system:
- Old `elapsed` values are preserved in timer state
- As soon as a timer starts, it creates its first event
- Old elapsed values are gradually replaced by event-based calculations
- No data loss - old timers work as before until first use

## Future Enhancements

### 1. Analytics Dashboard (Priority: High)
**What**: Visual charts showing time distribution
**Implementation**:
- Create new route `/analytics`
- Use Chart.js or Recharts
- Show: daily totals, project breakdown, hourly heatmap

### 2. Export Functionality (Priority: Medium)
**What**: Export time events to CSV/JSON
**Use Case**: Import into other tools, share with clients
```typescript
const exportToCSV = (events: TimeEvent[]) => {
  const csv = events.map(e => 
    `${e.projectName},${e.taskName},${new Date(e.startTime)},${e.endTime ? new Date(e.endTime) : 'Running'}`
  ).join('\n');
  // Download CSV file
};
```

### 3. Event Editing (Priority: Low)
**What**: Retroactively edit or delete time sessions
**Use Case**: Forgot to stop timer, want to correct duration
**Implementation**: Add edit UI to modify event start/end times

### 4. Multi-Day View (Priority: Medium)
**What**: Keep more than just today's events
**Implementation**: 
- Store with date keys
- Lazy load historical data
- Add date picker to view past days

### 5. Recurring Tasks (Priority: Low)
**What**: Track total time across all sessions of same task
**Implementation**: Group events by task name, show cumulative total

### 6. Break Detection (Priority: Low)
**What**: Automatically detect long breaks between sessions
**Implementation**: Analyze gaps between events, suggest adding "break" entries

## Performance Considerations

### Current Scale
- **Events per day**: ~50-100 (assuming ~25 timer sessions)
- **Storage size**: ~5-10 KB per day
- **Calculation cost**: O(n) where n = number of events per timer (typically <10)

### At Scale (100 days of history)
- **Total events**: ~5,000-10,000
- **Storage size**: ~500 KB - 1 MB
- **Mitigation**: 
  - Keep only recent events in memory
  - Archive old events to IndexedDB or backend
  - Paginate historical views

### Optimization Strategy
```typescript
// Cache calculated totals
const timerTotalsCache = useMemo(() => {
  return groups.map(group => ({
    groupId: group.id,
    timers: group.timers.map(timer => ({
      timerId: timer.id,
      total: calculateElapsedFromEvents(timeEvents, group.id, timer.id)
    }))
  }));
}, [timeEvents, groups]);
```

## Testing Recommendations

### Accuracy Tests
1. Start timer, wait exactly 60 seconds, verify elapsed = 60
2. Start timer, switch tabs for 5 minutes, return, verify accuracy
3. Start timer, refresh page, verify it resumes correctly
4. Start timer A, switch to timer B, verify A stopped and B started

### Event Integrity Tests
1. Verify no overlapping events for same timer
2. Verify all stopped events have endTime
3. Verify only one event has endTime = null at a time
4. Verify events are filtered by date correctly

### Migration Tests
1. Load app with old localStorage format, verify timers work
2. Start old timer, verify it creates first event
3. Verify old elapsed value preserved until first use

## Summary

The time event system solves the accuracy problem AND sets up the foundation for powerful analytics. The key insight is: **store the truth (timestamps), calculate the view (elapsed time)**.

**Date Implemented**: September 30, 2025
**Implemented By**: GitHub Copilot
**Tested**: Not yet - awaiting user validation
