# Multi-Timer Architecture

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT HIERARCHY                       │
└─────────────────────────────────────────────────────────────┘

                          Home (page.tsx)
                                │
                    ProtectedRoute
                                │
                        MultiTimer (main)
                        │
          ┌─────────────┼─────────────┬──────────┐
          │             │             │          │
      ProjectPicker   Timer         Timer       ...
      (per group)   (per timer)  (per timer)
          │             │
          └─ Menus ─────┘
                │
        ┌───────┼───────┐
        │       │       │
     TimeEntry  TimeHistory  EditTimeSlot
      Modal      Modal        Modal


┌─────────────────────────────────────────────────────────────┐
│                      DATA MODEL                              │
└─────────────────────────────────────────────────────────────┘

TimerState:
├── groups: TimerGroup[]
│   ├── id: string
│   ├── projectId: string | null
│   ├── projectName: string
│   └── timers: TimerData[]
│       ├── id: string
│       ├── taskId: string | null
│       ├── taskName: string
│       ├── notes: string
│       └── elapsed: number (calculated from events)
│
├── timeEvents: TimeEvent[]
│   ├── id: string
│   ├── timerId: string (reference to TimerData)
│   ├── groupId: string
│   ├── startTime: number (ms)
│   ├── endTime: number | null
│   ├── projectName: string (snapshot)
│   ├── taskName: string (snapshot)
│   └── notes: string (snapshot)
│
├── runningSession: RunningSession | null
│   ├── timerId: string
│   ├── groupId: string
│   ├── eventId: string
│   └── startTime: number (ms)
│
├── isCompact: boolean
├── projectSearchTerms: Record<string, string>
└── Modal states:
    ├── timeEntryModal: {isOpen, groupId, timerId}
    ├── timeHistoryModal: {isOpen, groupId, timerId}
    └── editTimeSlotModal: {isOpen, eventId}


┌─────────────────────────────────────────────────────────────┐
│                    STORAGE ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

localStorage
├── multi-timer/state
│   └── {groups: TimerGroup[], isCompact: boolean}
│
├── multi-timer/time-events
│   └── TimeEvent[] (all time, filtered to today on load)
│
├── multi-timer-auth-token
│   └── "Bearer token string"
│
└── multi-timer-user
    └── User (JSON)

sessionStorage
└── multi-timer/running
    └── RunningSession | null


┌─────────────────────────────────────────────────────────────┐
│                    TIMER LIFECYCLE                           │
└─────────────────────────────────────────────────────────────┘

START TIMER:
1. handleTimerStart(groupId, timerId)
   ├── Call handleTimerStop() if running
   ├── Create TimeEvent:
   │   ├── startTime: Date.now()
   │   ├── endTime: null
   │   └── snapshot: {projectName, taskName, notes}
   ├── Create RunningSession
   └── Update: timeEvents[], runningSession
   
2. useEffect monitors runningSession
   └── Start 1-second interval for real-time updates

RUNNING:
- Every 1 second:
  ├── calculateElapsedFromEvents(timerId)
  │   ├── Sum completed TimeEvents
  │   └── Add current running time
  └── Update groups[].timers[].elapsed

STOP TIMER:
1. handleTimerStop()
   ├── Find active RunningSession
   ├── Update TimeEvent: endTime = Date.now()
   ├── Recalculate elapsed for stopped timer
   └── Clear runningSession
   
2. useEffect clears 1-second interval


┌─────────────────────────────────────────────────────────────┐
│                  DATA PERSISTENCE FLOW                       │
└─────────────────────────────────────────────────────────────┘

HYDRATION (on mount):
1. Load from localStorage:
   ├── multi-timer/state → groups, isCompact
   ├── multi-timer/time-events → timeEvents
   └── multi-timer/running → runningSession (sessionStorage)

2. Validate:
   ├── Normalize all data
   ├── Filter timeEvents to today only
   └── Validate runningSession (timer still exists?)

3. Calculate:
   └── Recalculate all elapsed times from events

PERSISTENCE (on state change):
- groups or isCompact changes:
  └── setItem(multi-timer/state)
  
- timeEvents changes:
  └── setItem(multi-timer/time-events)
  
- runningSession changes:
  ├── if exists: setItem(multi-timer/running)
  └── if null: removeItem(multi-timer/running)


┌─────────────────────────────────────────────────────────────┐
│                    API INTEGRATION FLOW                      │
└─────────────────────────────────────────────────────────────┘

INITIALIZATION (on mount, if authenticated):
1. Load Projects:
   ├── GET /zoho_projects (with Bearer token)
   ├── normaliseProjects() → standardize field names
   └── setProjects()

2. Load Tasks:
   ├── GET /zoho_tasks (with Bearer token)
   ├── normaliseTasks() → standardize field names
   └── setTasks()

SYNCING (when projects/tasks change):
- When projects load:
  └── Update any matching group.projectName values
  
- When tasks load:
  └── Update any matching timer.taskName values

FILTERING (for UI):
- tasksByProject useMemo:
  ├── Input: tasks array
  ├── Process: Group by projectId
  └── Output: Map<projectId, Task[]>


┌─────────────────────────────────────────────────────────────┐
│                  ELAPSED TIME CALCULATION                    │
└─────────────────────────────────────────────────────────────┘

calculateElapsedFromEvents(timerId, events, session):
  ├── Sum completed events:
  │   ├── Filter: e.timerId === timerId && e.endTime !== null
  │   ├── Sum: (e.endTime - e.startTime) for each
  │   └── Result: completedMs
  │
  ├── Add running time:
  │   ├── If session?.timerId === timerId:
  │   │   ├── runningMs = Date.now() - session.startTime
  │   │   └── totalMs = completedMs + runningMs
  │   └── Else: totalMs = completedMs
  │
  └── Convert & Return: Math.floor(totalMs / 1000)

Used by:
- Hydration: Calculate initial elapsed for all timers
- Real-time loop: Update every 1 second
- Event changes: Recalculate when events modified
- Timer state: Display in HH:MM:SS format


┌─────────────────────────────────────────────────────────────┐
│                 MODAL STATE INTERACTIONS                     │
└─────────────────────────────────────────────────────────────┘

TimeEntryModal:
├── Trigger: "Add Time" menu button
├── Input: Date, start time, end time
├── Validation:
│   ├── All fields filled
│   ├── Valid hours/minutes
│   ├── Not in future
│   └── Duration ≥ 1 minute
└── Action: Create TimeEvent, close modal

TimeHistoryModal:
├── Trigger: "View History" menu button
├── Display:
│   ├── All TimeEvents for this timer
│   ├── Grouped by date
│   └── Total duration
├── Actions:
│   ├── Edit event → open EditTimeSlotModal
│   ├── Stop running timer
│   └── Add new time → open TimeEntryModal
└── Close: Exit modal

EditTimeSlotModal:
├── Trigger: Edit button on event in history
├── Input: Modified startTime, endTime
├── Actions:
│   ├── Save → Update event, recalculate elapsed
│   └── Delete → Remove event, recalculate elapsed
└── Close: Return to previous modal or main view


┌─────────────────────────────────────────────────────────────┐
│                    KEY CONSTRAINTS                           │
└─────────────────────────────────────────────────────────────┘

Single Running Timer:
- Only one timer globally active at a time
- Switching timers auto-stops the previous
- Prevents event overlap and data conflicts

Today's Data:
- Only today's events loaded into state
- Older events kept in localStorage, not loaded
- Filters by: midnight ≤ startTime < next midnight (local)

Project-Task Binding:
- Selecting a project clears all task assignments
- Forces task selection from correct project
- Prevents orphaned task references

Data Snapshots:
- Event captures projectName, taskName, notes at creation time
- Prevents history from changing retroactively
- Ensures data integrity for time tracking records


┌─────────────────────────────────────────────────────────────┐
│                 NORMALIZATION PATTERNS                       │
└─────────────────────────────────────────────────────────────┘

ID Normalization:
  Input: string | number | undefined
  Process:
    ├── If string & non-empty → use as-is
    ├── If number → convert to string
    └── Else → null
  Output: string | null

Project/Task API Response:
  Handles multiple field name variations:
  ├── IDs: zoho_project_id | project_id | id
  ├── Names: project_name | name
  └── Fields: zoho_task_id, zoho_project_id, task_name
  
  Filters: Removes null/invalid entries

Storage Restoration:
  ├── normaliseGroup() → validate TimerGroup
  ├── normaliseTimer() → validate TimerData
  └── Both create defaults if invalid data
