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

**localStorage Keys (2025-10-16 update):**
- `'multi-timer/state'`: persisted timer groups plus compact mode preference.
- `'multi-timer/running'`: mirrors the currently active session in `sessionStorage` for tab restoration.
- `'multi-timer-auth-token'` / `'multi-timer-user'`: authentication cache.
- **Removed:** `'multi-timer/time-events'` is no longer written. Timer intervals are now fetched on demand, so history will refresh from Xano when needed instead of relying on localStorage.

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
- [x] Create time events in Xano (manual time entry)
- [ ] Update time events in Xano when timer stops
- [ ] Read/sync time events from Xano on app load
- [x] Delete time events from Xano when user deletes locally

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

### Implementation Log Template

Use this streamlined template for documenting each integration function:

---

#### Function: Manual Time Entry Backend Persistence
**Status:** ✅ Complete

**Purpose:** Enable manual time entry with backend persistence to Xano zoho_timers and zoho_timer_intervals tables, handling date-based timer logic where same frontend timer card maps to multiple backend records (one per active_date).

**API Endpoints:**
- POST `/zoho_timers` - Create timer record with active_date
- POST `/zoho_timer_intervals` - Create time interval linked to timer

**Implementation:**
1. Created Xano API client library (`src/lib/xano-timers.ts`) with type-safe functions and custom error handling
2. Extended `TimerData` interface with `backendTimerId` and `lastActiveDate` for state tracking
3. Extended `TimeEvent` interface with `backendIntervalId` and `activeDate` for backend linkage
4. Implemented conditional timer creation: creates new backend timer if none exists OR if date differs from last active date
5. Added loading/error states in `TimeEntryModal` with user-friendly feedback
6. Updated `handleAddManualTime` to async with try-catch error handling and state rollback on failures

**Code Changes:**
- `src/lib/xano-timers.ts` (NEW) - Xano API client with type definitions, error handling, helper functions
- `src/components/MultiTimer.tsx` - Updated interfaces, async `handleAddManualTime`, state management for backend IDs
- `src/components/TimeEntryModal.tsx` - Added selectedDate parameter, loading states, error display

**Notes:**
- Backend IDs stored in frontend state enable future edit/delete operations
- Date-based timer logic allows historical tracking with one backend timer per date
- Build validation passed, E2E testing pending backend deployment

---

#### Function: Delete Time Interval Backend Sync
**Status:** ✅ Complete

**Purpose:** Enable deletion of time intervals with backend synchronization, automatically updating parent timer's total_duration in Xano when intervals are deleted from the frontend.

**API Endpoints:**
- DELETE `/zoho_timer_intervals/{id}` - Delete interval and update parent timer duration

**Implementation:**
1. Added `deleteZohoTimerInterval` function to Xano API client with proper authentication and error handling
2. Updated `handleDeleteTimeSlot` to async function that calls backend DELETE before removing from frontend state
3. Implemented conditional backend deletion: only calls API if event has `backendIntervalId` (supports legacy events without backend IDs)
4. Added error handling with user-friendly messages and state preservation on failure
5. Prevents frontend deletion if backend deletion fails to maintain data consistency

**Code Changes:**
- `src/lib/xano-timers.ts:198-236` - Added `deleteZohoTimerInterval` function with error handling
- `src/components/MultiTimer.tsx:1159-1213` - Made `handleDeleteTimeSlot` async, added backend deletion logic
- `src/components/MultiTimer.tsx:8` - Added `deleteZohoTimerInterval` to imports

**Notes:**
- Backend automatically adjusts parent timer's duration when interval is deleted
- Graceful handling of legacy intervals created before backend integration (no backendIntervalId)
- Data consistency maintained by preventing frontend deletion if backend call fails
- Build validation passed successfully

---

#### Function: Timer Start/Stop/Resume Backend Sync
**Status:** ✅ Complete

**Purpose:** Connect timer start, stop, and resume actions to Xano so live tracking stays synchronized with backend timer intervals and statuses.

**API Endpoints:**
- POST `/zoho_timers/start` - Create timer (when needed) and open first interval
- POST `/zoho_timers/stop` - Close the active interval and update timer totals
- POST `/zoho_timers/resume` - Reopen a stopped timer by creating a new interval

**Implementation:**
1. Updated API helpers to include `start_time`, `resume_time`, and `end_time` payloads and normalised responses that now return the timer object directly.
2. Reworked `handleTimerStart`/`handleTimerStop` to perform optimistic UI updates using client-side timestamps, then reconcile elapsed totals once the backend timer comes back.
3. Dropped localStorage persistence for interval history; the running session now drives optimistic updates while historical requests will re-fetch from Xano when required.

**Code Changes:**
- `src/lib/xano-timers.ts` - Adjusted payload types and helper return shapes for the new timestamp contract.
- `src/components/MultiTimer.tsx` - Added optimistic start/stop logic, timestamp payloads, and removed localStorage interval persistence.
- `src/components/Timer.tsx` - No change required in this round (callbacks already async-compatible).
- `docs/XANO_INTEGRATION.md` - Documented the updated flow and payloads.

**Notes:**
- Start/resume requests now include the exact UI timestamp so optimistic updates match backend-calculated totals when the response arrives.
- Backend responses return only the timer record; interval details are fetched separately when needed.
- History views currently take a step back until the fetch-on-demand workflow is implemented (localStorage cache removed intentionally).

---

#### Function: [Function Name]
**Status:** 🚧 In Progress | ✅ Complete | ❌ Blocked

**Purpose:** [One-line description of what this function does]

**API Endpoints:**
- [METHOD] `/endpoint` - [Description]

**Implementation:**
1. [Key implementation step]
2. [Key implementation step]
3. [Key implementation step]

**Code Changes:**
- `path/to/file1.ts` - [Brief description]
- `path/to/file2.ts` - [Brief description]

**Notes:**
- [Important observations or issues]
- [Any blockers or pending work]

---

## API Endpoints

### Timer Controls

- **POST `/zoho_timers/start`** – Body expects `user_id`, `zoho_project_id`, `zoho_task_id`, optional `notes`, optional `start_time` (Unix ms). Response returns the updated timer object.
- **POST `/zoho_timers/resume`** – Body expects `timer_id` plus optional `resume_time` (Unix ms). Response returns the updated timer object.
- **POST `/zoho_timers/stop`** – Body expects `timer_id` and optional `end_time` (Unix ms). Response returns the updated timer object with refreshed `total_duration` and status.

**Key contract changes (2025-10-16):**
- Interval records are no longer included in these responses; fetch them separately when history is requested.
- Client-provided timestamps drive optimistic UI updates so that final totals align with backend calculations once responses arrive.

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

**[2025-10-16] - Optimistic Timer Controls:**
- Removed localStorage persistence of interval history; timers now fetch intervals on demand to stay aligned with backend truth.
- UI provides optimistic updates using client timestamps passed as `start_time`, `resume_time`, and `end_time` so backend totals match what the user saw immediately.
- Xano timer endpoints now return only the timer object; interval inspection and history rely on future dedicated fetches.
- Pending follow-up: the optimistic stop flow still flashes the previous elapsed total before reconciliation. We need to persist the running-session event into state earlier (or gate the display update) so elapsed seconds never jump backwards while awaiting the stop response.

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

**Phase 1: Core CRUD Operations** - 50% Complete
- [x] Function 1: Create time event (manual entry)
- [ ] Function 2: Update time event
- [ ] Function 3: Read time events
- [x] Function 4: Delete time event

**Phase 2: Project/Task Sync** - 0% Complete
- [ ] Function 5-8: [To be defined]

**Phase 3: Advanced Features** - 0% Complete
- [ ] Function 9+: [To be defined]

**Total Integration Progress:** 50% (Phase 1)

---

**Next Steps:**
1. Set up Xano database schema
2. Define complete API contract
3. Implement first function: Create time event on timer start
4. Document results and lessons learned
5. Proceed to next function

---

*This document will be updated after each function implementation to maintain a complete record of the integration process.*
