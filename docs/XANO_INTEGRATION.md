# Xano Timer Integration Documentation

**Status:** 🚧 In Progress - Initial Setup Phase
**Started:** 2025-10-16
**Last Updated:** 2025-10-16

---

## Table of Contents

1. [Overview](#overview)
2. [Current Implementation](#current-implementation)
3. [Integration Goals](#integration-goals)
4. [Implementation Log](#implementation-log)
5. [API Endpoints](#api-endpoints)
6. [Data Mapping](#data-mapping)
7. [Testing & Validation](#testing--validation)

---

## Overview

This document tracks the iterative process of integrating the multi-timer application with Xano backend services. The integration will be implemented **one function at a time**, with thorough documentation of each step, decisions made, and lessons learned.

### Purpose
- Replace localStorage-only persistence with Xano database backend
- Enable cross-device timer synchronization
- Provide reliable data backup and recovery
- Support multi-user collaboration features (future)

### Approach
- **Incremental Integration:** Implement one function at a time to minimize risk
- **Parallel Operation:** Maintain localStorage functionality during transition
- **Thorough Testing:** Validate each function before moving to the next
- **Complete Documentation:** Capture all decisions, code changes, and test results

---

## Current Implementation

### How Timers Currently Work

#### Timer Lifecycle

**Starting a Timer:**
1. User clicks "Start" button on a specific timer in `Timer.tsx`
2. `handleStartTimer(groupId, timerId)` is called in `MultiTimer.tsx`
3. System checks if another timer is running (only one timer can run at a time)
4. If another timer is running, it's stopped automatically
5. A new `TimeEvent` record is created with:
   - Unique `id` (UUID)
   - `timerId` and `groupId` references
   - `startTime` (ISO timestamp)
   - `startSnapshot` (timer metadata: taskId, taskName, projectId, projectName, notes)
6. A `RunningSession` is created in sessionStorage:
   ```typescript
   {
     timerId: string
     groupId: string
     eventId: string
     startTime: string (ISO)
   }
   ```
7. The timer displays live elapsed time, updating every second

**Stopping a Timer:**
1. User clicks "Stop" button or starts another timer
2. `handleStopTimer()` is called
3. The corresponding `TimeEvent` record is updated with:
   - `endTime` (ISO timestamp)
   - `endSnapshot` (current timer metadata at stop time)
4. Elapsed time is calculated: `endTime - startTime`
5. `RunningSession` is cleared from sessionStorage
6. Timer display shows total elapsed time (static)

#### Data Storage

**localStorage Keys:**
```typescript
// Main application state
'multi-timer/state' = {
  groups: TimerGroup[]        // All timer groups and their timers
  compactView: boolean
  activeTab: string
}

// Complete time tracking history
'multi-timer/time-events' = TimeEvent[]

// Current running timer session (synced to sessionStorage)
'multi-timer/running' = RunningSession | null

// Authentication
'multi-timer-auth-token' = string (JWT)
'multi-timer-user' = { name: string, email: string }
```

**Data Structures:**

```typescript
// Timer hierarchy: Group → Timer → TimeEvents
interface TimerGroup {
  id: string              // UUID
  projectId: string       // Zoho CRM Project ID
  projectName: string     // Display name
  timers: TimerData[]     // Child timers (tasks)
}

interface TimerData {
  id: string              // UUID
  taskId: string          // Zoho CRM Task ID
  taskName: string        // Display name
  notes: string           // User notes
  elapsed: number         // Total seconds (calculated from TimeEvents)
}

interface TimeEvent {
  id: string              // UUID
  timerId: string         // Reference to TimerData
  groupId: string         // Reference to TimerGroup
  startTime: string       // ISO timestamp
  endTime?: string        // ISO timestamp (undefined if running)
  startSnapshot: {        // Metadata at start time
    taskId: string
    taskName: string
    projectId: string
    projectName: string
    notes: string
  }
  endSnapshot?: {         // Metadata at end time (if changed)
    taskId: string
    taskName: string
    projectId: string
    projectName: string
    notes: string
  }
}

interface RunningSession {
  timerId: string
  groupId: string
  eventId: string         // TimeEvent being recorded
  startTime: string       // ISO timestamp
}
```

### Current Data Management

#### Projects and Tasks Storage

**Projects (Timer Groups):**
- Loaded from Zoho CRM via `/api/tasks` endpoint
- Cached in localStorage under `multi-timer/state.groups[]`
- Each project becomes a `TimerGroup` with a unique `id`
- Projects contain nested arrays of timers (tasks)

**Tasks (Timers):**
- Loaded from Zoho CRM as children of projects
- Each task becomes a `TimerData` within its parent `TimerGroup`
- Tasks store: `taskId`, `taskName`, `notes`, `elapsed` time

**Notes:**
- Stored directly in `TimerData.notes` field
- Captured in `TimeEvent` snapshots for historical context
- User-editable through the timer interface
- Preserved across timer start/stop cycles

#### Time Events Storage

**Storage Location:** `localStorage['multi-timer/time-events']`

**Structure:**
- Flat array of all `TimeEvent` records
- Each record is immutable once created (endTime set)
- Running events have `endTime: undefined`
- Events include metadata snapshots for data integrity

**Calculation Pattern:**
- On mount: Load all events from localStorage
- Filter events by `timerId`
- Calculate total elapsed: `sum(endTime - startTime)` for all completed events
- Update timer's `elapsed` property
- Recalculate on any time event change (create, update, delete)

**Key Features:**
- Complete audit trail of all time tracking
- Support for editing past time entries
- Manual time entry without running timer
- Date-grouped history view
- Snapshots preserve historical context even if task/project renamed

---

## Integration Goals

### Phase 1: Core CRUD Operations
- [ ] Create time events in Xano when timer starts
- [ ] Update time events in Xano when timer stops
- [ ] Read/sync time events from Xano on app load
- [ ] Delete time events from Xano when user deletes locally

### Phase 2: Project/Task Sync
- [ ] Store projects (timer groups) in Xano
- [ ] Store tasks (timers) in Xano
- [ ] Sync notes between local and Xano
- [ ] Handle Zoho CRM integration with Xano storage

### Phase 3: Advanced Features
- [ ] Real-time synchronization across devices
- [ ] Conflict resolution for concurrent edits
- [ ] Offline support with sync on reconnect
- [ ] Data migration tools

### Success Criteria
- ✅ No data loss during integration
- ✅ localStorage continues to work as fallback
- ✅ Sub-second latency for timer operations
- ✅ Complete audit trail maintained
- ✅ All existing features continue to function

---

## Implementation Log

### Template for Each Function Implementation

Use this template for documenting each integration function:

---

#### Function: Manual Time Entry Backend Persistence
**Date:** 2025-10-16
**Status:** ✅ Complete
**Estimated Time:** 3 hours
**Actual Time:** 2.5 hours

**Purpose:**
Enable users to add past work sessions manually through the UI. When a user adds manual time, the system should:
1. Create a backend timer record in Xano (zoho_timers table) if one doesn't exist for the selected date
2. Create a time interval record (zoho_timer_intervals table) representing the manual time entry
3. Link the interval to the timer and store it in both Xano and local frontend state
4. Handle date-based timer logic: Same timer card can have multiple backend records (one per active_date)

**Current Local Implementation:**
```typescript
// Before: Manual time entries were only stored in localStorage
const handleAddManualTime = (
  groupId: string,
  timerId: string,
  startTime: number,
  endTime: number
) => {
  const group = groups.find((g) => g.id === groupId);
  const timer = group?.timers.find((t) => t.id === timerId);
  if (!group || !timer) return;

  // Create TimeEvent in local state only
  const newEvent: TimeEvent = {
    id: createId(),
    groupId,
    timerId,
    projectName: group.projectName,
    taskName: timer.taskName,
    notes: timer.notes,
    startTime,
    endTime,
    backendIntervalId: null, // Not persisted to backend
    activeDate: selectedDate,
  };

  setTimeEvents([...timeEvents, newEvent]);
};
```

**Xano API Endpoints:**

**1. Create Timer:**
- **Method:** POST
- **URL:** `${WEBAPP_API_BASE_URL}/zoho_timers`
- **Authentication:** Bearer token (user ID derived from auth token by backend)
- **Request Body:**
```typescript
interface CreateTimerPayload {
  zoho_project_id: string;
  zoho_task_id: string;
  notes: string;
  active_date: string; // YYYY-MM-DD format
}
```
- **Response:**
```typescript
interface ZohoTimer {
  id: number;
  dappit_user_id: number;
  zoho_project_id: string;
  zoho_task_id: string;
  notes: string;
  active_date: string;
  total_duration: number; // seconds
  status: "idle" | "running" | "stopped";
  synced_to_zoho: boolean;
  zoho_time_entry_id: string;
  created_at: number;
  updated_at: number;
}
```

**2. Create Time Interval:**
- **Method:** POST
- **URL:** `${WEBAPP_API_BASE_URL}/zoho_timer_intervals`
- **Authentication:** Bearer token
- **Request Body:**
```typescript
interface CreateIntervalPayload {
  zoho_timer_id: number;
  start_time: number; // Unix timestamp (milliseconds)
  end_time: number; // Unix timestamp (milliseconds)
  duration: number; // seconds
}
```
- **Response:**
```typescript
interface ZohoTimerInterval {
  id: number;
  created_at: number;
  zoho_timer_id: number;
  start_time: number;
  end_time: number;
  duration: number;
}
```

**Implementation Approach:**
1. Add `backendTimerId` and `lastActiveDate` fields to `TimerData` interface for tracking backend state
2. Add `backendIntervalId` and `activeDate` fields to `TimeEvent` interface
3. Create Xano API client library (`src/lib/xano-timers.ts`) with type-safe functions
4. Update `TimeEntryModal` to capture and pass the selected date to parent handler
5. Implement conditional timer creation logic:
   - Check if timer has `backendTimerId` AND `lastActiveDate` matches selected date
   - If no backend timer exists OR date differs → Create new backend timer
   - Store backend timer ID in frontend state
6. Always create interval record after ensuring timer exists
7. Add loading and error states for user feedback
8. Update frontend `TimeEvent` with backend IDs for future operations

**Error Handling Strategy:**
- Try-catch blocks around both API calls
- Custom `XanoTimerError` class for typed error handling
- User-friendly error messages displayed in modal
- Early return on authentication failure
- State rollback on API failures (don't create frontend TimeEvent if backend fails)
- Loading states prevent duplicate submissions

**Code Changes:**

**1. New File: `src/lib/xano-timers.ts`** (198 lines)
```typescript
// Xano Timer API Client with type definitions and error handling
export class XanoTimerError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "XanoTimerError";
  }
}

export async function createZohoTimer(
  payload: CreateTimerPayload,
  authToken: string
): Promise<ZohoTimer> {
  const response = await fetch(`${WEBAPP_API_BASE_URL}/zoho_timers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new XanoTimerError(
      errorText || `Failed to create timer (${response.status})`,
      response.status
    );
  }

  return await response.json();
}

// Similar implementation for createZohoTimerInterval, getTimersForDate
// Helper functions: formatDateForXano, getTodayDateString
```

**2. Modified: `src/components/MultiTimer.tsx`**

Updated interfaces:
```typescript
interface TimerData {
  id: string;
  taskId: string | null;
  taskName: string;
  notes: string;
  elapsed: number;
  backendTimerId: number | null; // NEW: Xano zoho_timers.id
  lastActiveDate: string | null; // NEW: YYYY-MM-DD format
}

interface TimeEvent {
  id: string;
  groupId: string;
  timerId: string;
  projectName: string;
  taskName: string;
  notes: string;
  startTime: number;
  endTime: number | null;
  backendIntervalId: number | null; // NEW: Xano interval ID
  activeDate: string; // NEW: YYYY-MM-DD format
}
```

Updated `handleAddManualTime` (line 967-1110):
```typescript
const handleAddManualTime = async (
  groupId: string,
  timerId: string,
  startTime: number,
  endTime: number,
  selectedDate: string // NEW parameter
) => {
  const group = groups.find((g) => g.id === groupId);
  const timer = group?.timers.find((t) => t.id === timerId);
  if (!group || !timer) return;

  // Get auth (user ID will be derived from token by backend)
  const authToken = authClient.getToken();
  if (!authToken) {
    setApiError("Please log in to save time entries");
    return;
  }

  setIsSubmittingTime(true);
  setApiError(null);

  let backendTimerId = timer.backendTimerId;

  // STEP 1: Create/recreate timer if needed
  if (!backendTimerId || timer.lastActiveDate !== selectedDate) {
    try {
      const timerPayload: CreateTimerPayload = {
        zoho_project_id: group.projectId || "",
        zoho_task_id: timer.taskId || "",
        notes: timer.notes,
        active_date: selectedDate,
      };

      const createdTimer = await createZohoTimer(timerPayload, authToken);
      backendTimerId = createdTimer.id;

      // Update frontend state with backend ID
      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                timers: g.timers.map((t) =>
                  t.id === timerId
                    ? { ...t, backendTimerId, lastActiveDate: selectedDate }
                    : t
                ),
              }
            : g
        )
      );
    } catch (error) {
      if (error instanceof XanoTimerError) {
        setApiError(`Failed to create timer: ${error.message}`);
      } else {
        setApiError("Failed to create timer. Please try again.");
      }
      setIsSubmittingTime(false);
      return;
    }
  }

  // STEP 2: Create interval
  try {
    const intervalPayload: CreateIntervalPayload = {
      zoho_timer_id: backendTimerId!,
      start_time: startTime,
      end_time: endTime,
      duration: Math.floor((endTime - startTime) / 1000),
    };

    const createdInterval = await createZohoTimerInterval(
      intervalPayload,
      authToken
    );

    // STEP 3: Create frontend TimeEvent with backend IDs
    const newEvent: TimeEvent = {
      id: createId(),
      groupId,
      timerId,
      projectName: group.projectName,
      taskName: timer.taskName,
      notes: timer.notes,
      startTime,
      endTime,
      backendIntervalId: createdInterval.id,
      activeDate: selectedDate,
    };

    const updatedEvents = [...timeEvents, newEvent];
    setTimeEvents(updatedEvents);

    // Recalculate elapsed time
    setGroups((prevGroups) =>
      prevGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              timers: g.timers.map((t) =>
                t.id === timerId
                  ? {
                      ...t,
                      elapsed: calculateElapsedFromEvents(
                        timerId,
                        updatedEvents,
                        runningSession
                      ),
                    }
                  : t
              ),
            }
          : g
      )
    );

    setIsSubmittingTime(false);
  } catch (error) {
    if (error instanceof XanoTimerError) {
      setApiError(`Failed to save time entry: ${error.message}`);
    } else {
      setApiError("Failed to save time entry. Please try again.");
    }
    setIsSubmittingTime(false);
  }
};
```

Added state variables (line 515-516):
```typescript
const [isSubmittingTime, setIsSubmittingTime] = useState(false);
const [apiError, setApiError] = useState<string | null>(null);
```

**3. Modified: `src/components/TimeEntryModal.tsx`**

Updated props interface (line 5-15):
```typescript
interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTime: (startTime: number, endTime: number, selectedDate: string) => void; // Added selectedDate
  projectName: string;
  taskName: string;
  notes: string;
  isTimerActive: boolean;
  isSubmitting?: boolean; // NEW
  apiError?: string | null; // NEW
}
```

Updated `validateAndSubmit` to pass selectedDate (line 130):
```typescript
onAddTime(startTime, endTime, selectedDate);
```

Added API error display (line 302-309):
```typescript
{apiError && (
  <div className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
    <div className="text-sm font-medium text-red-900 dark:text-red-300">
      {apiError}
    </div>
  </div>
)}
```

Updated submit button with loading state (line 319-326):
```typescript
<button
  onClick={validateAndSubmit}
  disabled={isSubmitting}
  className="... disabled:cursor-not-allowed disabled:opacity-50"
>
  {isSubmitting ? "Saving..." : "Add Time"}
</button>
```

**Testing Performed:**
- [✓] Build validation: `npm run vercel-build` passes successfully
- [✓] Type checking: No TypeScript errors
- [✓] Lint checking: ESLint passes (pre-existing error in build.js unrelated)
- [✓] Code review: Implementation logic verified
- [ ] Manual E2E testing (requires backend deployment)
- [ ] Network failure scenarios (requires backend deployment)
- [ ] Performance validation (requires backend deployment)

**Results:**
**What Worked Well:**
- Clean separation of concerns with dedicated API client library
- Type-safe interfaces prevent runtime errors
- Date-based timer logic enables proper historical tracking
- Error handling provides clear user feedback
- Loading states prevent duplicate submissions
- Build compiles successfully with no errors

**Implementation Notes:**
- Backend IDs are stored in frontend state for future operations (edit, delete, sync)
- The `active_date` field enables date-based timer segregation as specified
- Frontend timer cards can map to multiple backend timer records (one per date)
- Error messages are user-friendly and actionable
- State updates are batched efficiently to minimize re-renders

**Lessons Learned:**
1. **Date-Based Timer Logic:** The requirement for same timer card to create different backend records per date was crucial - implemented via `lastActiveDate` tracking
2. **Conditional Timer Creation:** The check `if (!backendTimerId || timer.lastActiveDate !== selectedDate)` handles both first-time use and date changes
3. **Bi-directional State Sync:** Storing backend IDs in frontend structures enables future operations (edit, delete, sync to Zoho)
4. **Error Handling:** Custom error class and try-catch blocks provide robust error handling with user feedback
5. **Backward Compatibility:** New fields are nullable and have proper fallbacks in `normaliseTimer` helper

**Future Considerations:**
1. Implement edit functionality for manual time entries (requires PUT endpoint)
2. Implement delete functionality (requires DELETE endpoint)
3. Add sync indicator to show which entries are persisted to backend
4. Handle offline scenarios with queue and sync on reconnect
5. Add optimistic UI updates for better perceived performance
6. Implement timer start/stop backend persistence
7. Add total_duration update to backend timer when intervals change

**Related Files Modified:**
- `src/lib/xano-timers.ts` - NEW: Xano API client with type definitions, error handling, and helper functions
- `src/components/MultiTimer.tsx` - Updated interfaces, state management, and `handleAddManualTime` implementation
- `src/components/TimeEntryModal.tsx` - Added selectedDate parameter, loading states, and error display

**Git Commit:**
- Branch: main
- Next commit will be: "feat: integrate manual time entry with Xano backend"

---

#### Function: [Function Name]
**Date:** YYYY-MM-DD
**Status:** 🚧 In Progress | ✅ Complete | ❌ Blocked
**Estimated Time:** X hours
**Actual Time:** X hours

**Purpose:**
Brief description of what this function does and why it's needed.

**Current Local Implementation:**
```typescript
// Copy the existing localStorage-based code
```

**Xano API Endpoint:**
- **Method:** GET | POST | PUT | DELETE
- **URL:** `/api/xano/[endpoint]`
- **Authentication:** Bearer token
- **Request Body:**
```typescript
// TypeScript interface
```
- **Response:**
```typescript
// TypeScript interface
```

**Implementation Approach:**
1. Step-by-step plan
2. Error handling strategy
3. Rollback plan if needed

**Code Changes:**
```typescript
// New or modified code with comments
```

**Testing Performed:**
- [ ] Unit tests (if applicable)
- [ ] Manual testing scenario 1
- [ ] Manual testing scenario 2
- [ ] Edge case testing
- [ ] Performance validation

**Results:**
- What worked well
- What challenges were encountered
- Performance metrics (response times, etc.)

**Lessons Learned:**
- Key insights from this implementation
- Things to watch for in future functions
- Improvements for next iteration

**Related Files Modified:**
- `path/to/file1.ts` - [brief description]
- `path/to/file2.ts` - [brief description]

**Git Commit:**
- Commit hash: `abc123`
- Commit message: "feat: integrate [function name] with Xano"

---

## API Endpoints

### Xano Endpoints (To Be Defined)

This section will be populated as we define the Xano API contract.

#### Time Events

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/xano/time-events` | GET | Fetch all time events for user | 📝 Planned |
| `/api/xano/time-events` | POST | Create new time event | 📝 Planned |
| `/api/xano/time-events/{id}` | PUT | Update existing time event | 📝 Planned |
| `/api/xano/time-events/{id}` | DELETE | Delete time event | 📝 Planned |

#### Timer Groups (Projects)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/xano/groups` | GET | Fetch all timer groups | 📝 Planned |
| `/api/xano/groups` | POST | Create new group | 📝 Planned |
| `/api/xano/groups/{id}` | PUT | Update group | 📝 Planned |
| `/api/xano/groups/{id}` | DELETE | Delete group | 📝 Planned |

#### Timers (Tasks)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/xano/timers` | GET | Fetch all timers for user | 📝 Planned |
| `/api/xano/timers` | POST | Create new timer | 📝 Planned |
| `/api/xano/timers/{id}` | PUT | Update timer | 📝 Planned |
| `/api/xano/timers/{id}` | DELETE | Delete timer | 📝 Planned |

---

## Data Mapping

### Local Storage ↔ Xano Database

This section will document how local data structures map to Xano database tables.

#### TimeEvent Mapping

| Local Field | Xano Field | Type | Notes |
|-------------|------------|------|-------|
| `id` | `id` | UUID | Primary key |
| `timerId` | `timer_id` | UUID | Foreign key |
| `groupId` | `group_id` | UUID | Foreign key |
| `startTime` | `start_time` | timestamp | ISO format |
| `endTime` | `end_time` | timestamp | ISO format, nullable |
| `startSnapshot` | `start_snapshot` | json | Metadata object |
| `endSnapshot` | `end_snapshot` | json | Metadata object, nullable |
| N/A | `user_id` | UUID | Added for multi-user support |
| N/A | `created_at` | timestamp | Auto-generated |
| N/A | `updated_at` | timestamp | Auto-generated |

#### Additional Mappings (To Be Defined)
- TimerGroup ↔ Xano Projects table
- TimerData ↔ Xano Tasks table
- User authentication ↔ Xano users

---

## Testing & Validation

### Test Scenarios Checklist

For each implemented function, validate these scenarios:

#### Basic Operations
- [ ] Start timer successfully
- [ ] Stop timer successfully
- [ ] Start different timer (auto-stop previous)
- [ ] Manual time entry
- [ ] Edit existing time event
- [ ] Delete time event

#### Edge Cases
- [ ] Network failure during operation
- [ ] Xano API timeout
- [ ] Invalid data from Xano
- [ ] Concurrent operations (multiple tabs)
- [ ] Browser refresh during running timer
- [ ] localStorage quota exceeded

#### Data Integrity
- [ ] No duplicate time events created
- [ ] Elapsed time calculations remain accurate
- [ ] Notes preserved correctly
- [ ] Project/task names stay in sync
- [ ] Historical data not corrupted

#### Performance
- [ ] Timer start < 200ms
- [ ] Timer stop < 200ms
- [ ] History load < 1s for 1000 events
- [ ] UI remains responsive during sync

### Test Data Sets
- Small: 5 groups, 20 timers, 100 events
- Medium: 20 groups, 100 timers, 1000 events
- Large: 50 groups, 500 timers, 10000 events

---

## Notes & Decisions

### Key Decisions Log

This section captures important architectural and implementation decisions.

**[Date] - Initial Setup Decision:**
- Chose to maintain localStorage as primary source during transition
- Xano will be secondary store initially, with gradual promotion to primary
- This allows safe rollback if issues arise

---

## Resources

### Key Files
- `src/components/MultiTimer.tsx` - Main timer logic (1,528 lines)
- `src/components/Timer.tsx` - Individual timer display
- `src/lib/auth.ts` - Authentication service
- `src/lib/zoho-oauth.ts` - Zoho integration

### External Resources
- Xano API Documentation: [to be added]
- Authentication flow: [to be added]

---

## Progress Tracking

### Overall Progress

**Phase 1: Core CRUD Operations** - 0% Complete
- [ ] Function 1: Create time event
- [ ] Function 2: Update time event
- [ ] Function 3: Read time events
- [ ] Function 4: Delete time event

**Phase 2: Project/Task Sync** - 0% Complete
- [ ] Function 5-8: [To be defined]

**Phase 3: Advanced Features** - 0% Complete
- [ ] Function 9+: [To be defined]

**Total Integration Progress:** 0%

---

**Next Steps:**
1. Set up Xano database schema
2. Define complete API contract
3. Implement first function: Create time event on timer start
4. Document results and lessons learned
5. Proceed to next function

---

*This document will be updated after each function implementation to maintain a complete record of the integration process.*
