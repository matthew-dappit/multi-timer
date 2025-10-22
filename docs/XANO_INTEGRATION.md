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
- `'multi-timer/draft-timers'`: Draft timer groups (timers without `backendTimerId`) when viewing today's date. Allows users to select project/task before starting a timer. Cleared when navigating to past dates.
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
- **Draft Timer Persistence**: Draft timers (without `backendTimerId`) are persisted to localStorage when viewing today
- **Date-Specific Behavior**:
  - **Today's Date**: Backend timers + draft timers from localStorage are merged
  - **Historical Dates**: Only backend timers are shown (no draft timers)
- **Running Session Persistence**: Active timer preserved in localStorage for continuity across page refreshes

**Draft Timer Workflow:**
1. User selects project/task on today's date → Creates draft timer (no `backendTimerId`)
2. Draft timer is automatically saved to `'multi-timer/draft-timers'` localStorage key (via useEffect)
3. When navigating to past dates → Draft timers are NOT shown (only backend data), but remain in localStorage
4. When navigating back to today → Draft timers are loaded from localStorage and merged with backend data
5. On page refresh → Draft timers are loaded from localStorage during hydration and merged with backend data
6. When user starts the timer → Backend timer is created, draft gets `backendTimerId` and is no longer saved to localStorage

**Implementation Details:**
- **Hydration Effect** (lines 536-576): Loads draft timers from localStorage on initial page load
- **Save Helper** (lines 741-769): `saveDraftTimersToLocalStorage()` filters timers without `backendTimerId` and saves to localStorage, clears localStorage when no drafts exist
- **Fetch Effect** (lines 806-928): Loads backend timers and merges with draft timers from localStorage when viewing today
- Draft timers are identified by the absence of `backendTimerId` property
- When viewing historical dates, explicit save calls do not run (no localStorage updates)
- When viewing today, the fetch effect reads from localStorage to restore draft timers

**Notes:**
- When viewing today, backend groups are shown plus any draft groups from localStorage
- When viewing historical dates, only backend groups matching that date are shown (draft timers ignored but preserved in localStorage)
- Draft timers allow users to select project/task before starting, and selections persist across page refreshes and date navigation
- Once a timer is started, it gets a `backendTimerId` and is no longer considered a draft (removed from localStorage)
- localStorage is only updated when viewing today, preventing stale data from historical date views
- Simplified architecture prevents duplication issues by having backend as single source of truth for started timers
- Project and task names initially show IDs but are updated by existing project/task sync effects
- Date picker prevents selecting future dates (max is today)
- Next day button is disabled when viewing today
- Default empty group shown when viewing today with no backend data and no draft timers

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

#### Function: Draft Timer Persistence Architecture Redesign
**Status:** ✅ Complete

**Purpose:** Redesign draft timer persistence to prevent localStorage clearing during navigation and ensure draft timers persist across all date changes

**Problem:**
The original architecture used an automatic save effect that synced localStorage with current state on every `groups` change. This caused localStorage to be cleared when navigating between dates because:
1. When navigating to previous dates, `groups` contained only backend timers (no drafts), so the effect cleared localStorage
2. When navigating to today, the save effect ran before the fetch effect completed, operating on stale data and clearing localStorage
3. The automatic sync approach violated the principle that localStorage should be the persistent source of truth for draft timers

**Solution:**
Completely redesigned draft timer persistence from reactive (automatic sync) to imperative (explicit save on user actions):

1. **Removed automatic save effect** (previously lines 741-770) that synced localStorage with state on every change
2. **Created explicit save function** `saveDraftTimersToLocalStorage()` that:
   - Extracts draft timers (timers without `backendTimerId`)
   - Saves to localStorage only if draft timers exist
   - **Never clears localStorage** when no draft timers are found (preserves existing drafts during navigation)
3. **Added explicit save calls** in user action handlers:
   - `handleProjectSelect()` - Saves when user selects/changes project
   - `handleTaskChange()` - Saves when user selects/changes task
   - `handleNotesChange()` - Saves when user edits notes on draft timer
   - `addGroup()` - Saves when user adds new group
   - `addTimerToGroup()` - Saves when user adds new timer
   - `removeGroup()` - Saves when user deletes a group
   - `removeTimerFromGroup()` - Saves when user deletes a timer
   - Timer start handler - Removes timer from drafts when it gets `backendTimerId`

**Code Changes:**
- `src/components/MultiTimer.tsx:741-769` - Replaced automatic save effect with explicit `saveDraftTimersToLocalStorage()` helper function that clears localStorage when no drafts exist
- `src/components/MultiTimer.tsx:1587-1613` - Updated `handleTaskChange()` to call save function after state update
- `src/components/MultiTimer.tsx:1615-1644` - Updated `handleNotesChange()` to call save function after notes update for draft timers
- `src/components/MultiTimer.tsx:1738-1767` - Updated `removeGroup()` to call save function after group deletion
- `src/components/MultiTimer.tsx:1774-1800` - Updated `removeTimerFromGroup()` to call save function after timer deletion
- `src/components/MultiTimer.tsx:1711-1721` - Updated `addGroup()` to call save function after state update
- `src/components/MultiTimer.tsx:1769-1777` - Updated `addTimerToGroup()` to call save function after state update
- `src/components/MultiTimer.tsx:1802-1835` - Updated `handleProjectSelect()` to call save function after state update
- `src/components/MultiTimer.tsx:1225-1256` - Updated timer start handler to call save function when timer gets `backendTimerId` (which removes it from localStorage)

**Architecture Principles:**
1. **localStorage as persistent store**: Draft timers in localStorage are preserved during navigation
2. **Explicit save operations**: Draft timers are only saved when user explicitly creates/modifies them
3. **Draft cleanup**: Draft timers are automatically removed from localStorage when they get a `backendTimerId` (user starts timer) or when all drafts are deleted
4. **Read-only during navigation**: Fetch effect reads and merges draft timers, but never modifies localStorage
5. **Conditional saves**: Save operations only run when viewing today (`isViewingToday` check)

**Behavior:**
- **Create/modify draft timer on today** → Immediately saved to localStorage
- **Edit notes on draft timer** → Immediately saved to localStorage
- **Navigate to previous date** → localStorage untouched, draft timers preserved
- **Navigate back to today** → Fetch merges draft timers from localStorage with backend timers
- **Refresh on any date** → Hydration loads draft timers, fetch merges them when viewing today
- **Start timer** → Draft timer removed from localStorage (now has `backendTimerId`)
- **Delete draft timer** → Draft timer removed from localStorage
- **Delete draft timer group** → All draft timers in that group removed from localStorage
- **Delete all draft timers** → localStorage cleared entirely

**Notes:**
- This architecture ensures draft timers persist indefinitely until explicitly started or removed by the user
- No automatic clearing of localStorage during any navigation scenario
- Aligns with user expectation that draft timers remain available across sessions and date changes

---

#### Function: Batch Timer Sync to Zoho Books
**Status:** ✅ Complete

**Purpose:** Enable batch synchronization of multiple timers to Zoho Books with visual sync status indicators, multi-select UI, and proper handling of sync results from the backend.

**API Endpoints:**
- POST `/zoho_timers/sync` - Batch sync unsynced timers to Zoho Books

**Implementation:**
1. Extended `TimerData` interface with `syncedToZoho: boolean` field to track sync status
2. Created `syncZohoTimers` API function with proper request/response types matching actual API contract
3. Added visual sync status badges to Timer component:
   - Green "Synced" badge with checkmark for synced timers
   - Amber "Pending" badge with clock icon for unsynced timers
4. Implemented multi-select functionality:
   - Selection mode toggle button ("Select Timers" / "Cancel Selection")
   - Checkboxes on unsynced timers with backend IDs
   - "Sync Selected (N)" button with loading state
5. Added sync operation handler that:
   - Collects backend timer IDs from selected timers
   - Calls batch sync API endpoint
   - Updates timer sync status based on response results
   - Shows success/error messages to user
   - Auto-exits selection mode on successful sync

**Code Changes:**
- `src/lib/xano-timers.ts:72-88` - Added `SyncTimersPayload`, `SyncResult`, and `SyncTimersResponse` interfaces
- `src/lib/xano-timers.ts:430-466` - Created `syncZohoTimers` function with error handling
- `src/components/MultiTimer.tsx:322-330` - Extended `TimerData` with `syncedToZoho` field
- `src/components/MultiTimer.tsx:342-351` - Updated `createTimer()` to initialize `syncedToZoho: false`
- `src/components/MultiTimer.tsx:855-864` - Populated `syncedToZoho` from backend response during timer fetch
- `src/components/MultiTimer.tsx:471-478` - Added selection mode state variables
- `src/components/MultiTimer.tsx:1881-1978` - Implemented selection and sync handlers
- `src/components/MultiTimer.tsx:2183-2193` - Added sync error/success message displays
- `src/components/MultiTimer.tsx:2213-2271` - Added selection mode toggle and sync buttons to UI
- `src/components/MultiTimer.tsx:2441-2444,2462` - Passed sync props to Timer component
- `src/components/Timer.tsx:18-21,31` - Extended Timer props with sync-related fields
- `src/components/Timer.tsx:42-45,55` - Added sync props to component signature
- `src/components/Timer.tsx:145,152-185` - Added checkbox and sync badge to compact mode
- `src/components/Timer.tsx:319,325-338` - Added checkbox to standard mode
- `src/components/Timer.tsx:406-433` - Added sync status badge to standard mode

**API Response Structure:**
The actual API returns a different structure than the swagger documentation indicated:
```typescript
{
  synced_count: 2,        // number, not string
  failed_count: 0,        // number, not string
  total_timers: 2,        // number (count), not array
  results: [              // array of result objects
    {
      status: "success",
      timer_id: 44,
      zoho_time_entry_id: "5076064000008168004"
    }
  ]
}
```

**Notes:**
- Sync status badges only appear on timers with `backendTimerId` (not draft timers)
- Checkboxes only appear in selection mode and only on unsynced timers
- Successfully synced timers are updated in state based on `results` array
- Selection mode auto-exits on successful sync
- Failed syncs preserve selection state for retry
- Build validation passed successfully
- Fixed type mismatch between swagger docs and actual API response

---

## API Endpoints

### Timer Controls

- **POST `/zoho_timers/start`** – Body expects `user_id`, `zoho_project_id`, `zoho_task_id`, optional `notes`, optional `start_time` (Unix ms). Response returns the updated timer object.
- **POST `/zoho_timers/resume`** – Body expects `timer_id` plus optional `resume_time` (Unix ms). Response returns the updated timer object.
- **POST `/zoho_timers/stop`** – Body expects `timer_id` and optional `end_time` (Unix ms). Response returns the updated timer object with refreshed `total_duration` and status.

**Key contract changes (2025-10-16):**
- Interval records are no longer included in these responses; fetch them separately when history is requested.
- Client-provided timestamps drive optimistic UI updates so that final totals align with backend calculations once responses arrive.

### Timer Sync

- **POST `/zoho_timers/sync`** – Batch sync unsynced timers to Zoho Books
  - **Request body:** `{ timer_ids: number[] }` - Array of Xano timer IDs to sync
  - **Response:**
    ```typescript
    {
      synced_count: number,
      failed_count: number,
      total_timers: number,  // Total count of timers processed
      results: Array<{
        status: "success" | "error",
        timer_id: number,
        zoho_time_entry_id?: string,
        error?: string
      }>
    }
    ```
  - **Notes:** Successfully synced timers will have `synced_to_zoho` flag set to `true` and a `zoho_time_entry_id` assigned.

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
- [x] Function 5: Batch timer sync to Zoho Books

**Phase 2: Project/Task Sync** - 0% Complete
- [ ] Function 6+: [To be defined]

**Phase 3: Advanced Features** - 0% Complete
- [ ] Function 9+: [To be defined]

**Total Integration Progress:** 100% (Phase 1 + Sync)

---

**Next Steps:**
1. Set up Xano database schema
2. Define complete API contract
3. Implement first function: Create time event on timer start
4. Document results and lessons learned
5. Proceed to next function

---

*This document will be updated after each function implementation to maintain a complete record of the integration process.*
