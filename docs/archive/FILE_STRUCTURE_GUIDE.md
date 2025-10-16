# Multi-Timer File Structure & Quick Reference

## Directory Layout

```
multi-timer/
├── docs/
│   ├── IMPLEMENTATION_SUMMARY.md  ← Comprehensive codebase analysis
│   ├── ARCHITECTURE.md             ← State flow diagrams
│   └── FILE_STRUCTURE_GUIDE.md     ← This file
│
├── src/
│   ├── app/
│   │   ├── page.tsx               ← Home page (entry point)
│   │   ├── layout.tsx             ← Root layout
│   │   ├── insights/
│   │   │   └── page.tsx           ← Insights page (analytics view)
│   │   └── integrations/
│   │       └── zoho/
│   │           └── callback/
│   │               └── page.tsx   ← Zoho OAuth callback handler
│   │
│   ├── components/
│   │   ├── MultiTimer.tsx         ← Main timer container
│   │   │                             • State management (groups, events, session)
│   │   │                             • Timer start/stop logic
│   │   │                             • localStorage persistence
│   │   │                             • Project/task API integration
│   │   │                             • Real-time elapsed calculation
│   │   │                             • Modal management
│   │   │
│   │   ├── Timer.tsx              ← Individual timer display
│   │   │                             • Start/stop button
│   │   │                             • Task dropdown
│   │   │                             • Notes textarea
│   │   │                             • Compact vs standard layout
│   │   │                             • Menu button (add time / history)
│   │   │
│   │   ├── TimeEntryModal.tsx      ← Manual time entry form
│   │   │                             • Date & time input (HH:MM format)
│   │   │                             • Validation logic
│   │   │                             • Duration preview
│   │   │
│   │   ├── TimeHistoryModal.tsx    ← View timer history
│   │   │                             • Group events by date
│   │   │                             • Display total duration
│   │   │                             • Edit/delete/stop buttons
│   │   │
│   │   ├── EditTimeSlotModal.tsx   ← Edit individual time events
│   │   │                             • Modify start/end times
│   │   │                             • Delete event option
│   │   │                             • Recalculate elapsed
│   │   │
│   │   ├── ProjectPicker.tsx       ← Project dropdown selector
│   │   │                             • Search functionality
│   │   │                             • Duplicate prevention
│   │   │                             • Click-outside handling
│   │   │
│   │   ├── AuthForm.tsx            ← Login/signup form
│   │   │                             • Email & password input
│   │   │                             • Login/signup toggle
│   │   │                             • Error display
│   │   │
│   │   ├── ProtectedRoute.tsx      ← Authentication wrapper
│   │   │                             • Checks auth status
│   │   │                             • Shows fallback if not authenticated
│   │   │
│   │   ├── Navbar.tsx              ← Navigation bar (if used)
│   │   │
│   │   └── TimeInsights.tsx        ← Analytics/insights component
│   │                                  • Time tracking statistics
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx         ← Authentication context provider
│   │                                  • User state
│   │                                  • Login/signup/logout
│   │                                  • Token management
│   │                                  • Auth state verification
│   │
│   └── lib/
│       ├── auth.ts                 ← Authentication utilities
│       │                              • authClient: token/user storage
│       │                              • authAPI: login/signup/logout/verify
│       │
│       └── zoho-oauth.ts           ← Zoho OAuth integration
│                                      • OAuth initiation
│                                      • Callback handling
│                                      • Status checking
│                                      • Connection management
│
├── public/
│   └── [static assets]
│
├── package.json                    ← Dependencies & scripts
├── tsconfig.json                   ← TypeScript config
├── tailwind.config.js              ← Tailwind CSS config
├── eslint.config.mjs               ← ESLint configuration
├── next.config.js                  ← Next.js configuration
├── .env.example                    ← Environment variable template
└── .gitignore                      ← Git ignore rules
```

---

## Core Component Reference

### MultiTimer.tsx (State Hub)
**Responsibilities:**
- Root state management (groups, timeEvents, runningSession, projects, tasks)
- Storage hydration & persistence
- Timer lifecycle (start/stop/add/edit/delete)
- API integration (projects & tasks)
- Real-time elapsed calculation
- Modal state management

**Key State:**
```typescript
const [groups, setGroups] = useState<TimerGroup[]>()
const [timeEvents, setTimeEvents] = useState<TimeEvent[]>()
const [runningSession, setRunningSession] = useState<RunningSession | null>()
const [projects, setProjects] = useState<ZohoProject[]>()
const [tasks, setTasks] = useState<ZohoTask[]>()
```

**Key Methods:**
- `calculateElapsedFromEvents()` - compute elapsed time
- `handleTimerStart()` - start timer, create event
- `handleTimerStop()` - stop timer, close event
- `handleAddManualTime()` - create manual time entry
- `handleSaveTimeSlot()` - update existing event
- `handleDeleteTimeSlot()` - remove event
- `handleTaskChange()` - update timer task
- `handleNotesChange()` - update timer notes
- `handleProjectSelect()` - change project, clear tasks

**useEffects:**
1. Hydration (on mount) - load from storage
2. Project loading - fetch from API
3. Task loading - fetch from API
4. Project syncing - update names
5. Task syncing - update names
6. Groups persistence - save to localStorage
7. Events persistence - save to localStorage
8. Session persistence - save to sessionStorage
9. Real-time updates - 1-second interval when running

---

### Timer.tsx (Display Component)
**Props:**
```typescript
interface TimerProps {
  id: string
  taskId: string | null
  taskName: string
  notes: string
  elapsed: number
  isCompact: boolean
  isActive?: boolean
  taskOptions: Array<{id: string, name: string}>
  isTaskSelectDisabled?: boolean
  isTaskOptionsLoading?: boolean
  onTaskChange: (id, taskId, taskName) => void
  onNotesChange: (id, notes) => void
  onStart?: () => void
  onStop?: () => void
  onOpenTimeEntry?: () => void
  onOpenTimeHistory?: () => void
}
```

**Renders:**
- Compact mode: small card, hover menu
- Standard mode: full-size card, always-visible menu
- Status indicator (Running / Idle)
- Task dropdown
- Notes textarea
- Start/Stop button
- Menu: Add Time, View History

---

### Storage Keys Reference

| Key | Scope | Data Type | Persistence |
|-----|-------|-----------|-------------|
| `multi-timer/state` | localStorage | `{groups, isCompact}` | Full |
| `multi-timer/time-events` | localStorage | `TimeEvent[]` | Full |
| `multi-timer/running` | sessionStorage | `RunningSession\|null` | Session |
| `multi-timer-auth-token` | localStorage | string | Full |
| `multi-timer-user` | localStorage | User (JSON) | Full |

---

## Data Flow Examples

### Example 1: Start Timer
```
User clicks "Start" button
  ↓
Timer.onStart() → MultiTimer.handleTimerStart(groupId, timerId)
  ↓
Create TimeEvent { startTime: Date.now(), endTime: null, ... }
Create RunningSession { startTime: Date.now(), ... }
  ↓
Update state:
  - Add event to timeEvents[]
  - Set runningSession
  ↓
Persist to storage:
  - localStorage[multi-timer/time-events]
  - sessionStorage[multi-timer/running]
  ↓
useEffect detects runningSession
  ↓
Start 1-second interval:
  - calculateElapsedFromEvents() every second
  - Update groups[].timers[].elapsed
  - Re-render Timer with new elapsed value
```

### Example 2: Add Manual Time
```
User clicks "Add Time" menu item
  ↓
Timer.onOpenTimeEntry()
  ↓
MultiTimer opens TimeEntryModal
  ↓
User enters date, start time, end time, clicks "Add Time"
  ↓
TimeEntryModal.validateAndSubmit()
  ↓
MultiTimer.handleAddManualTime(groupId, timerId, startTime, endTime)
  ↓
Create TimeEvent:
  {
    id: createId(),
    startTime: timestamp,
    endTime: timestamp,
    projectName, taskName, notes: snapshots
  }
  ↓
Add to timeEvents[], recalculate elapsed
  ↓
Persist to localStorage[multi-timer/time-events]
  ↓
Close modal, display updated elapsed time
```

### Example 3: Load Projects
```
Component mounts (or token changes)
  ↓
useEffect runs (dependency: token)
  ↓
authClient.getToken() → exists
  ↓
Fetch GET /zoho_projects with Bearer token
  ↓
Response: [{id: 123, name: "Project A"}, ...]
  ↓
normaliseProjects() → validate & standardize
  ↓
setProjects([{id: "123", name: "Project A"}, ...])
  ↓
Another useEffect detects projects change
  ↓
For each group with matching projectId:
  Update group.projectName if changed
  ↓
Save updated groups to localStorage[multi-timer/state]
```

---

## Normalization Functions

### normaliseProjects(payload: unknown): ZohoProject[]
- Input: API response array
- Validates each project object
- Maps field names: `zoho_project_id|project_id|id`, `project_name|name`
- Converts number IDs to strings
- Filters invalid entries
- Output: `ZohoProject[]`

### normaliseTasks(payload: unknown): ZohoTask[]
- Input: API response array
- Validates each task object
- Maps field names: `zoho_task_id|id`, `zoho_project_id`, `task_name|name`
- Converts number IDs to strings
- Filters invalid entries
- Output: `ZohoTask[]`

### normaliseGroup(candidate: unknown, index: number): TimerGroup
- Input: Parsed localStorage data (or default)
- Validates structure
- Normalizes IDs (strings or null)
- Ensures at least one timer exists
- Output: `TimerGroup` (valid or default)

### normaliseTimer(candidate: unknown): TimerData
- Input: Parsed localStorage data (or default)
- Validates structure
- Normalizes IDs (strings or null)
- Resets elapsed to 0 (recalculated from events)
- Output: `TimerData` (valid or default)

---

## API Endpoints

### Xano/Webapp API
**Base URL:** `process.env.NEXT_PUBLIC_WEBAPP_API_BASE_URL`

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/zoho_projects` | Bearer token | Fetch user's projects |
| GET | `/zoho_tasks` | Bearer token | Fetch user's tasks |

### Auth API
**Base URL:** `process.env.NEXT_PUBLIC_AUTH_API_BASE_URL`

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/login` | None | User login |
| POST | `/auth/signup` | None | User registration |
| GET | `/auth/me` | Bearer token | Get current user |

### Zoho OAuth API
**Base URL:** `process.env.NEXT_PUBLIC_ZOHO_OAUTH_API_BASE_URL`

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/zoho/oauth/initiate` | Bearer token | Start OAuth flow |
| POST | `/zoho/oauth/callback` | State param | Handle OAuth callback |
| GET | `/zoho/oauth/status` | Bearer token | Check OAuth status |
| DELETE | `/zoho/oauth/disconnect` | Bearer token | Disconnect Zoho |

---

## Environment Variables

```bash
# Authentication API
NEXT_PUBLIC_AUTH_API_BASE_URL=https://auth.example.com

# Xano/Webapp API (projects, tasks)
NEXT_PUBLIC_WEBAPP_API_BASE_URL=https://api.dappit.org/api:XXXXXXXXXXX

# Zoho OAuth API
NEXT_PUBLIC_ZOHO_OAUTH_API_BASE_URL=https://oauth.example.com
```

---

## Common Patterns

### useEffect Hydration Pattern
```typescript
useEffect(() => {
  if (hasHydrated.current) return
  hasHydrated.current = true
  
  // Load from storage
  // Normalize data
  // Validate state
  // Calculate derived values
  
  setState(normalized)
}, [])
```

### useEffect Persistence Pattern
```typescript
useEffect(() => {
  if (!hasHydrated.current) return
  
  localStorage.setItem(KEY, JSON.stringify(data))
}, [data])
```

### Normalization Pattern
```typescript
const normalise = (candidate: unknown): Type => {
  if (!candidate || typeof candidate !== "object") {
    return createDefault()
  }
  
  const value = candidate as Partial<Type>
  
  return {
    ...sanitizeFields(value),
    ...validateConstraints(value)
  }
}
```

---

## Quick Task Reference

### To add a new timer field:
1. Update `TimerData` interface in MultiTimer.tsx
2. Update `createTimer()` default
3. Update `normaliseTimer()` validation
4. Update Timer component props & display
5. Update TimeEvent snapshot capture in `handleTimerStart()`

### To modify storage keys:
1. Update constant in MultiTimer.tsx
2. Update hydration logic
3. Update persistence useEffects
4. Clear browser storage for testing

### To add new API endpoint:
1. Add to appropriate lib file (auth.ts, zoho-oauth.ts)
2. Add error handling
3. Call in useEffect with token dependency
4. Add to environment variables if needed
5. Test with actual API

### To change elapsed time calculation:
1. Modify `calculateElapsedFromEvents()` function
2. Verify used in all required places:
   - Hydration
   - Real-time interval
   - Manual time entry
   - Event updates
3. Test with various time entries

---

## Testing Checklist

- [ ] Timer start/stop works
- [ ] Elapsed time updates every 1 second
- [ ] Manual time entry creates event
- [ ] Time events persist in localStorage
- [ ] Projects/tasks load from API
- [ ] Switching timers stops previous
- [ ] Compact mode toggle works
- [ ] Notes save correctly
- [ ] History modal displays all events
- [ ] Edit time slot updates elapsed
- [ ] Delete time slot removes event
- [ ] Page reload preserves running timer
- [ ] Browser close clears session timer
- [ ] Search filters projects correctly
- [ ] Today's events filter works
