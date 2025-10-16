# Multi-Timer Codebase Implementation Summary

## Project Overview
The multi-timer is a Next.js 15+ application built with React 19, TypeScript, and Tailwind CSS. It enables users to track time across multiple projects and tasks with local storage persistence and Zoho CRM integration via OAuth.

---

## 1. Timer State Management & Data Structures

### Core Data Models

#### TimerData (Individual Timer)
```typescript
interface TimerData {
  id: string;                 // Unique ID generated via createId()
  taskId: string | null;      // Zoho task ID (string or number, normalized to string)
  taskName: string;           // Display name of the task
  notes: string;              // User notes for this timer
  elapsed: number;            // Total elapsed seconds (calculated from TimeEvents)
}
```

#### TimerGroup (Project-level Container)
```typescript
interface TimerGroup {
  id: string;                 // Unique group ID
  projectId: string | null;   // Zoho project ID (string or number, normalized to string)
  projectName: string;        // Display name of the project
  timers: TimerData[];        // Array of individual timers
}
```

#### TimeEvent (Immutable Time Record)
```typescript
interface TimeEvent {
  id: string;                 // Unique event ID
  groupId: string;            // Reference to parent TimerGroup
  timerId: string;            // Reference to parent TimerData
  projectName: string;        // Snapshot of project name at event time
  taskName: string;           // Snapshot of task name at event time
  notes: string;              // Snapshot of notes at event time
  startTime: number;          // Unix timestamp in milliseconds
  endTime: number | null;     // null if currently running, otherwise timestamp
}
```

#### RunningSession (Active Timer State)
```typescript
interface RunningSession {
  timerId: string;            // ID of currently running timer
  groupId: string;            // ID of parent group
  eventId: string;            // ID of the active TimeEvent
  startTime: number;          // Start timestamp in milliseconds
}
```

---

## 2. Storage Architecture

### localStorage Keys
1. **`multi-timer/state`** - Groups and UI state
   - Stores: `{ groups: TimerGroup[], isCompact: boolean }`
   - Persisted on every state change
   - Used for: Restoring timer structure, compact mode preference

2. **`multi-timer/time-events`** - Historical time records
   - Stores: `TimeEvent[]`
   - Persisted on every state change
   - Filtered to today's events only on load via `filterTodayEvents()`
   - Used for: Calculating elapsed time, time history view

3. **`multi-timer-auth-token`** - Authentication token
   - Stores: JWT token string
   - Used by: Auth context, API requests

4. **`multi-timer-user`** - Cached user data
   - Stores: `User` object (JSON)
   - Used for: Offline user info availability

### sessionStorage Keys
1. **`multi-timer/running`** - Current session state
   - Stores: `RunningSession | null`
   - Used for: Tracking active timer across page reloads
   - Validated on load: timer must still exist in groups

### Storage Update Pattern
```typescript
// Hydration on mount
useEffect(() => {
  // Load state from localStorage
  // Filter timeEvents to today only
  // Restore running session if valid
  // Calculate elapsed times
}, [])

// Persist groups & compact mode
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({groups, isCompact}))
}, [groups, isCompact])

// Persist time events
useEffect(() => {
  localStorage.setItem(TIME_EVENTS_KEY, JSON.stringify(timeEvents))
}, [timeEvents])

// Persist running session
useEffect(() => {
  if (runningSession) {
    sessionStorage.setItem(RUNNING_SESSION_KEY, JSON.stringify(runningSession))
  } else {
    sessionStorage.removeItem(RUNNING_SESSION_KEY)
  }
}, [runningSession])
```

---

## 3. Timer Start/Stop Mechanism

### Starting a Timer
**Location:** `MultiTimer.tsx` - `handleTimerStart(groupId, timerId)`

```typescript
1. Stop any currently running timer via handleTimerStop()
2. Find the timer and group by ID
3. Create new TimeEvent:
   - Snapshot: projectName, taskName, notes
   - startTime: Date.now()
   - endTime: null (marks as running)
4. Create RunningSession with event ID and start time
5. Update state:
   - Add event to timeEvents array
   - Set runningSession
```

### Stopping a Timer
**Location:** `MultiTimer.tsx` - `handleTimerStop()`

```typescript
1. If no runningSession, do nothing
2. Get current timestamp (now)
3. Update timeEvents:
   - Find event matching runningSession.eventId
   - Set endTime to now
4. Recalculate elapsed time for stopped timer
5. Clear runningSession
```

### Real-time Update Loop
**Location:** `MultiTimer.tsx` - useEffect with 1-second interval

```typescript
- Runs only when runningSession exists
- Every 1 second: recalculate elapsed times for all timers
- Uses calculateElapsedFromEvents() to include current running time
- Updates groups state
- Clears interval on cleanup
```

---

## 4. Elapsed Time Calculation

**Function:** `calculateElapsedFromEvents(timerId, events, session)`

```typescript
1. Sum all completed TimeEvents for this timer:
   - Filter: e.timerId === timerId AND e.endTime !== null
   - Sum: (e.endTime - e.startTime) for each
   
2. Add current running time if this timer is active:
   - If session?.timerId === timerId:
     runningTime = Date.now() - session.startTime
   
3. Convert to seconds: Math.floor(totalMs / 1000)
4. Return total elapsed seconds
```

---

## 5. Time Entry & History Management

### Manual Time Entry
**Component:** `TimeEntryModal.tsx`

- Allows adding past work sessions
- Validates:
  - All fields filled
  - Time format: HH (00-23), MM (00-59)
  - Times not in future
  - End time > start time
  - Duration ≥ 1 minute
- Creates TimeEvent with:
  - startTime: Date with selected time
  - endTime: Date with selected time
  - Both set to selected date (no future times)

### Time History View
**Component:** `TimeHistoryModal.tsx`

- Groups events by date (ISO format)
- Shows most recent date first
- Formats: "Today", "Yesterday", or full date
- Displays:
  - Event time range (HH:MM format)
  - Duration in hours/minutes
  - Total time across all events
  - Running event with stop button
  - Completed events with edit button
- Allows adding new time or editing existing events

### Time Slot Editing
**Component:** `EditTimeSlotModal.tsx`

- Allows editing or deleting individual TimeEvents
- Can modify startTime and endTime
- Recalculates elapsed times on save/delete
- Updates the stored TimeEvent directly

---

## 6. Project & Task Integration

### Zoho API Endpoints Used
**Base URL:** `process.env.NEXT_PUBLIC_WEBAPP_API_BASE_URL`

1. **GET `/zoho_projects`**
   - Headers: `Authorization: Bearer ${token}`
   - Response: Array of projects with `id`, `name`
   - Supported field mappings:
     - ID: `zoho_project_id` → `project_id` → `id`
     - Name: `project_name` → `name`

2. **GET `/zoho_tasks`**
   - Headers: `Authorization: Bearer ${token}`
   - Response: Array of tasks with `id`, `projectId`, `name`
   - Supported field mappings:
     - Task ID: `zoho_task_id` → `id`
     - Project ID: `zoho_project_id`
     - Name: `task_name` → `name`

### Data Loading Flow
**Location:** `MultiTimer.tsx` - useEffect with token dependency

```typescript
1. On mount: load projects and tasks
2. Normalize response data using normaliseProjects() and normaliseTasks()
3. Handle field mapping variations:
   - Number IDs converted to strings
   - Multiple field names supported
   - Invalid entries filtered out
4. Set state: setProjects(), setTasks()
5. Handle errors: log and set empty arrays
```

### Project/Task Name Syncing
**Mechanism:** Two useEffects monitor projects/tasks arrays

```typescript
- When projects load:
  - Find matching project for each group.projectId
  - Update group.projectName if changed
  
- When tasks load:
  - Find matching task for each timer.taskId
  - Update timer.taskName if changed
```

### Task Filtering by Project
**Location:** `MultiTimer.tsx` - tasksByProject Map

```typescript
- Built via useMemo from tasks array
- Key: projectId
- Value: Array of tasks for that project
- Used for: Task dropdown in each timer
- Filtering: Only shows tasks for selected project
```

---

## 7. API Integration Patterns

### Authentication
**Library:** `src/lib/auth.ts`

```typescript
// Client-side storage
authClient.setToken(token)        // localStorage
authClient.getToken()              // localStorage lookup
authClient.isAuthenticated()        // !!token check
authClient.removeToken()            // Clear on logout

// API endpoints
authAPI.login(credentials)
authAPI.signup(credentials)
authAPI.logout()
authAPI.verifyToken()
authAPI.getCurrentUser(token?)
```

### Zoho OAuth Integration
**Library:** `src/lib/zoho-oauth.ts`

```typescript
zohoOAuthAPI.initiate()             // GET /zoho/oauth/initiate
zohoOAuthAPI.callback(data)         // POST /zoho/oauth/callback
zohoOAuthAPI.getStatus()            // GET /zoho/oauth/status
zohoOAuthAPI.disconnect()           // DELETE /zoho/oauth/disconnect
zohoOAuthAPI.startOAuthFlow()       // Redirect to Zoho auth URL
```

### Request Headers Pattern
```typescript
Authorization: `Bearer ${token}`
Content-Type: application/json (for POST)
```

### Error Handling
- Non-200 responses throw errors
- Error messages extracted from response text
- 401 responses: clear token and throw
- Errors logged to console
- UI shows error state or falls back to empty data

---

## 8. Component Architecture

### Component Hierarchy
```
page.tsx (Home)
├── ProtectedRoute
│   └── MultiTimer (main container)
│       ├── ProjectPicker (per group)
│       ├── Timer (per timer, child of MultiTimer)
│       └── Modals:
│           ├── TimeEntryModal
│           ├── TimeHistoryModal
│           └── EditTimeSlotModal
└── AuthForm (fallback when not authenticated)
```

### Component Responsibilities

**MultiTimer.tsx**
- State management for all groups and timers
- Storage persistence logic
- Project/task loading and syncing
- Timer start/stop logic
- Event creation and modification
- Modal state management
- Real-time elapsed time updates

**Timer.tsx**
- Display individual timer
- Start/stop button interactions
- Task dropdown selection
- Notes textarea
- Compact vs standard layouts
- Menu button for add time / view history

**TimeEntryModal.tsx**
- Form for manual time entry
- Date and time input validation
- Duration display
- Error/warning messages

**TimeHistoryModal.tsx**
- Display all TimeEvents for a timer
- Group by date
- Show total time
- Edit/delete buttons
- Stop running timer button

**EditTimeSlotModal.tsx**
- Edit or delete individual TimeEvent
- Date and time modification
- Recalculate elapsed on save

---

## 9. Key Features & Behaviors

### Multi-Timer Management
- Multiple timer groups (one per project)
- Multiple timers per group (one per task)
- Only one timer can run at a time globally
- Switching timers stops the current one

### Data Persistence
- Groups saved immediately to localStorage
- Time events saved immediately to localStorage
- Running session saved to sessionStorage (not persistent across browser close)
- Today's events filtered on load
- Invalid running sessions detected and closed

### Elapsed Time Calculation
- Real-time updates every 1 second during active timer
- Calculated from immutable TimeEvent records
- Includes current running time + all completed events
- Displayed in HH:MM:SS format

### Compact vs Standard Mode
- Toggle button in UI
- Compact: smaller cards, hidden elements, hover-activated menu
- Standard: full-size cards, always-visible menu, larger fonts
- Preference persisted in localStorage

### Time Zone Handling
- All timestamps: Unix milliseconds (Date.now())
- Time display: Uses browser's local time zone
- Date filtering: Based on local date (midnight to midnight)

---

## 10. Environment Configuration

### Required Environment Variables
```bash
NEXT_PUBLIC_AUTH_API_BASE_URL       # Auth server base URL
NEXT_PUBLIC_WEBAPP_API_BASE_URL     # Xano API base URL (for projects/tasks/Zoho)
NEXT_PUBLIC_ZOHO_OAUTH_API_BASE_URL # Zoho OAuth endpoints
```

### Current Usage
- All APIs use Bearer token authentication
- All URLs in NEXT_PUBLIC_* (safe for client-side)
- Fallback defaults in code (see MultiTimer.tsx line 10-11)

---

## 11. Data Validation & Normalization

### ID Normalization
- Input: string, number, or undefined
- Output: string or null
- Pattern: 
  ```typescript
  let id: string | null = null
  if (typeof rawId === "string" && rawId.trim()) {
    id = rawId
  } else if (typeof rawId === "number") {
    id = rawId.toString()
  }
  ```

### Project/Task Normalization Functions
- `normaliseProjects()` - validates and maps API response
- `normaliseTasks()` - validates and maps API response
- `normaliseGroup()` - restores saved group from storage
- `normaliseTimer()` - restores saved timer from storage

---

## 12. UI State Management

### Modal States
```typescript
interface TimeEntryModalState {
  isOpen: boolean
  groupId: string
  timerId: string
}

interface TimeHistoryModalState {
  isOpen: boolean
  groupId: string
  timerId: string
}

interface EditTimeSlotModalState {
  isOpen: boolean
  eventId: string
}
```

### UI Toggle States
- `isCompact` - toggle compact/standard mode
- `showMenu` - timer menu visibility (Timer component)
- `isOpen` - dropdown visibility (ProjectPicker component)
- `projectSearchTerms` - search input per group

---

## 13. Performance Optimizations

### Memoization
- `tasksByProject` - useMemo for task filtering
- `selectedProjectIds` - useMemo for duplicate project detection
- `filteredOptions` - useMemo in ProjectPicker for search filtering
- `optionList` - useMemo in ProjectPicker for option deduplication

### Interval Management
- Real-time update interval: only active when running
- Properly cleared on unmount
- 1-second granularity (not millisecond)

### Event Filtering
- Time events filtered to today only on load
- No historical data before today stored in state
- Reduces memory usage and load time

---

## 14. Known Limitations & Patterns

### Single Running Timer
- Only one timer can be active globally
- Switching timers auto-stops previous
- Prevents time event conflicts

### Today's Data Only
- Only today's events loaded on app start
- Older events not accessible in current UI
- Full history kept in localStorage (not filtered)

### Project Assignment
- Project selection clears all task assignments in that group
- Ensures tasks are always from correct project
- User must reselect task after project change

### Snapshot Data in Events
- projectName, taskName, notes copied into TimeEvent at creation
- Allows for name changes without breaking history
- Increases storage but improves data integrity

---

## Summary

The multi-timer implements a sophisticated client-side state management system with localStorage persistence, real-time updates, and integration with Zoho CRM via a backend API. Timer data is organized hierarchically (Groups → Timers → Events), with immutable TimeEvent records providing a reliable audit trail of all time tracking activity. The system supports manual time entry, task/project integration, and maintains data consistency through validation and normalization patterns.

