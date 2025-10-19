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
- `'multi-timer/compact-mode'`: UI compact mode preference only.
- `'multi-timer/running'`: Currently active timer session (persists across page refreshes).
- `'multi-timer-auth-token'` / `'multi-timer-user'`: authentication cache.
- **Removed:** `'multi-timer/state'` (timer groups) and `'multi-timer/time-events'` are no longer persisted. Backend is the single source of truth.

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
- **Elapsed Calculation Fix**: `calculateElapsedFromEvents` now accepts a baseline parameter (backend's `total_duration`) and only adds current session time, preventing timer resets when resuming.
- **Baseline Stability**: `runningTimerBaselineRef` stores the baseline when timer starts and remains constant throughout the session, preventing timer jumping during running and stopping phases.
- **Stop Calculation Order**: Baseline is captured before clearing the ref, ensuring optimistic stop calculation shows correct total (baseline + session time) instead of only session time.

---

#### Function: Date Navigation and Historical Timer Viewing
**Status:** ✅ Complete

**Purpose:** Enable users to navigate between dates and view historical timer data from the backend, with backend as the single source of truth for timer groups.

**API Endpoints:**
- GET `/zoho_timers?user_id={id}&active_date={date}` - Fetch all timers for a specific date

**Implementation:**
1. Added date state management with `activeDate` state tracking current viewing date and `isViewingToday` computed property
2. Created date navigation UI component with left/right arrows, date picker input, and "Jump to today" button
3. Implemented `useEffect` hook that fetches timers from backend whenever `activeDate` changes
4. Built automatic timer group/card creation from backend data: creates groups and timers based on project/task IDs
5. **Removed localStorage persistence of timer groups** - backend is single source of truth
6. Updated total time display to show selected date instead of always "Today's Total"
7. Added empty state message for historical dates with no timer data
8. **Simplified state management**: Timer groups come entirely from backend, session-only groups allowed for temporary UI creation

**Code Changes:**
- `src/lib/xano-timers.ts` - Already had `getTimersForDate` function available
- `src/components/MultiTimer.tsx:358-359` - Changed storage keys: removed `STORAGE_KEY`, added `COMPACT_MODE_KEY`
- `src/components/MultiTimer.tsx:601-620` - Simplified hydration: only load compact mode preference, no group loading
- `src/components/MultiTimer.tsx:760-768` - Persist only compact mode preference (not groups)
- `src/components/MultiTimer.tsx:810-872` - Simplified fetch logic: replace groups entirely with backend data
- `src/components/MultiTimer.tsx:1579-1673` - Date navigation handlers
- `src/components/MultiTimer.tsx:1778-1814` - Added `displayGroups` with default group for empty today view
- `src/components/MultiTimer.tsx:1830-1846` - Date display formatting
- `src/components/MultiTimer.tsx:1852-1922` - Date navigation UI
- `src/components/MultiTimer.tsx:1995-2023` - Empty state for historical dates

**Backend-First Architecture:**
- **Single Source of Truth**: Backend data completely replaces frontend state on fetch
- **No localStorage for Groups**: Groups are not persisted, only compact mode preference
- **Session-Only Groups**: Users can create groups/timers in UI (via "Add Project Group"/"Add Timer" buttons)
- **Ephemeral UI State**: Session-created groups exist only in memory, lost on page refresh
- **Running Session Persistence**: Active timer preserved in localStorage for continuity across page refreshes

**Notes:**
- When viewing today, backend groups are shown (plus any session-created groups)
- When viewing historical dates, only backend groups matching that date are shown
- On page refresh, all groups come from backend GET request (no localStorage cache)
- Users can create groups/timers in current session, but they disappear on refresh unless a timer is started (creates backend record)
- Simplified architecture prevents duplication issues by having single source of truth
- Project and task names initially show IDs but are updated by existing project/task sync effects
- Date picker prevents selecting future dates (max is today)
- Next day button is disabled when viewing today
- Default empty group shown when viewing today with no backend data

---

#### Function: Notes Field Editing with Backend Sync
**Status:** ✅ Complete

**Purpose:** Enable real-time note editing with immediate backend synchronization via PATCH request, removing debounce delays and implementing form-like submit behavior on blur/Enter.

**API Endpoints:**
- PATCH `/zoho_timers/{id}` - Update timer notes field

**Implementation:**
1. Removed 1-second debounce delay from `handleNotesChange` function - now sends PATCH immediately on blur/Enter
2. Converted `handleNotesChange` to async function with optimistic UI updates and error rollback
3. Added local state management (`compactNotesValue`, `standardNotesValue`) to prevent race conditions during typing
4. Implemented `isUserTypingRef` guard to prevent parent state from overwriting local state while user is actively editing
5. Made Enter key submit (trigger blur) in both compact and non-compact modes instead of creating new lines
6. Removed `latestNoteUpdateRef` and `noteUpdateTimeoutRef` complexity, simplified to direct async/await pattern

**Code Changes:**
- `src/components/MultiTimer.tsx:535-536` - Removed debounce-related refs (`latestNoteUpdateRef`, `noteUpdateTimeoutRef`)
- `src/components/MultiTimer.tsx:541-552` - Removed cleanup effect for timeout refs
- `src/components/MultiTimer.tsx:1626-1725` - Replaced entire `handleNotesChange` function: removed setTimeout logic, converted to async/await with immediate PATCH
- `src/components/Timer.tsx:50-52` - Added `standardNotesValue` state and `isUserTypingRef` for typing guard
- `src/components/Timer.tsx:54-60` - Updated sync effect to respect `isUserTypingRef` flag
- `src/components/Timer.tsx:62-65` - Removed `compactNotesValue` from focus effect dependencies to prevent re-selection on keystroke
- `src/components/Timer.tsx:210-223` - Updated compact mode textarea: removed `onChange` call to `onNotesChange`, added `isUserTypingRef` tracking, call parent only on blur
- `src/components/Timer.tsx:375-396` - Updated non-compact mode textarea: added local state, `isUserTypingRef` tracking, blur-only submission, Enter key handling

**Notes:**
- Notes now submit immediately on blur or Enter keypress (no debounce delay)
- Optimistic UI updates provide instant feedback while backend PATCH is in flight
- On error, notes revert to previous value automatically
- Shift+Enter is blocked in both modes to prevent multiline entries
- `isUserTypingRef` guard prevents parent state updates from overwriting user input during active typing
- Simplified codebase by removing ~150 lines of debounce/timeout management code

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

**Phase 1: Core CRUD Operations** - 100% Complete
- [x] Function 1: Create time event (manual entry)
- [x] Function 2: Timer start/stop/resume backend sync
- [x] Function 3: Read time events (GET /zoho_timers with date navigation)
- [x] Function 4: Delete time event

**Phase 2: Project/Task Sync** - 0% Complete
- [ ] Function 5-8: [To be defined]

**Phase 3: Advanced Features** - 0% Complete
- [ ] Function 9+: [To be defined]

**Total Integration Progress:** 100% (Phase 1)

---

**Next Steps:**
1. Set up Xano database schema
2. Define complete API contract
3. Implement first function: Create time event on timer start
4. Document results and lessons learned
5. Proceed to next function

---

*This document will be updated after each function implementation to maintain a complete record of the integration process.*
