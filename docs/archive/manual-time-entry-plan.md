# Manual Time Entry Feature Plan

**Date:** October 1, 2025
**Status:** ✅ COMPLETE - Implementation Finished

> See `MANUAL_TIME_ENTRY_COMPLETE.md` for full implementation details and testing checklist.

---

## Use Cases

### 1. Add New Timer with Past Time
**Scenario:** User did work on phone stopwatch, wants to add it to a new timer
- Project 2, Task 2, Note 1
- Worked from 9:00 AM - 9:45 AM (45 minutes)
- Timer should be created and show 45 minutes elapsed

### 2. Add Time Slots to Existing Timer
**Scenario:** User has existing timer with 51 minutes, wants to add more work periods
- Project 1, Task 1, Note 1 (already has 51 minutes)
- Add slot: 10:15 AM - 10:26 AM (11 minutes)
- Add slot: 10:51 AM - 10:58 AM (7 minutes)
- Timer should now show 51 + 11 + 7 = 69 minutes

### 3. Edit Existing Time Slots
**Scenario:** Power outage caused timer to run too long
- Timer logged: 12:30 PM - 2:30 PM (2 hours)
- Actually worked: 12:30 PM - 1:20 PM (50 minutes)
- Need to edit the end time

---

## UX Design Considerations

### Key Principles
1. **Non-disruptive** - Don't interfere with active timer
2. **Quick entry** - Minimal clicks for common cases
3. **Flexible** - Support various time entry methods
4. **Visible** - Show time slots clearly
5. **Editable** - Easy to fix mistakes

### Design Decisions

#### 1. Where to Access Manual Entry?
**Option A:** Button on each timer card
- ✅ Contextual - right where you need it
- ✅ Clear which timer you're editing
- ❌ Takes up space on card

**Option B:** Modal from timer card menu
- ✅ Cleaner UI
- ✅ More space for complex form
- ✅ Can show all time slots
- ✅ **RECOMMENDED**

**Decision:** Add a "⋮" menu button on each timer card with options:
- "Add Time Manually"
- "View Time History"

#### 2. Time Entry Method
**Option A:** Start time + End time pickers
- ✅ Precise
- ✅ Familiar pattern
- ❌ More clicks

**Option B:** Start time + Duration
- ✅ Faster for known durations
- ❌ Less intuitive for past work

**Option C:** Both options available
- ✅ Flexible
- ✅ **RECOMMENDED**

**Decision:** Provide both methods with a toggle

#### 3. Date Selection
**Default:** Today
**Options:** Date picker for past dates
**Constraint:** Cannot add future time slots

#### 4. Handling Active Timer Constraint
**Rule:** Cannot manually add time to currently running timer
**Reason:** Would conflict with live tracking
**UX:** Show message "Stop timer to add manual entries"

---

## UI Components

### 1. Timer Card Menu Button
```
┌─────────────────────────────┐
│ ● Running                 ⋮ │ ← Menu button
│                             │
│ Task Name                   │
│ 01:23:45                    │
│ Notes...                    │
│ [Stop]                      │
└─────────────────────────────┘
```

**Menu Options:**
- 📝 Add Time Manually
- 📊 View Time History
- 🗑️ Delete Timer (existing)

### 2. Manual Time Entry Modal

```
┌─────────────────────────────────────────┐
│  Add Time Manually                    × │
├─────────────────────────────────────────┤
│                                         │
│  Project: Project 1                     │
│  Task: Development Work                 │
│  Notes: Bug fixes                       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Date: [Oct 1, 2025 ▼]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Entry Method: ○ Time Range  ● Duration│
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Start Time: [09:00 AM]          │   │
│  │ Duration:   [45] minutes        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  OR                                     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Start Time: [09:00 AM]          │   │
│  │ End Time:   [09:45 AM]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│           [Cancel]  [Add Time]          │
└─────────────────────────────────────────┘
```

### 3. Time History Modal

```
┌─────────────────────────────────────────┐
│  Time History - Development Work      × │
├─────────────────────────────────────────┤
│  Project 1 • Bug fixes                  │
│  Total: 1h 23m                          │
│                                         │
│  Today (Oct 1, 2025)                    │
│  ┌─────────────────────────────────┐   │
│  │ 09:00 AM - 09:45 AM    45m   ✏️ │   │
│  │ 10:15 AM - 10:26 AM    11m   ✏️ │   │
│  │ 10:51 AM - 10:58 AM     7m   ✏️ │   │
│  │ 12:30 PM - Running...  20m   ⏹️ │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Yesterday (Sep 30, 2025)               │
│  ┌─────────────────────────────────┐   │
│  │ 02:00 PM - 03:15 PM    1h 15m ✏️│   │
│  └─────────────────────────────────┘   │
│                                         │
│           [+ Add Time]  [Close]         │
└─────────────────────────────────────────┘
```

### 4. Edit Time Slot Modal

```
┌─────────────────────────────────────────┐
│  Edit Time Slot                       × │
├─────────────────────────────────────────┤
│                                         │
│  Date: Oct 1, 2025                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Start Time: [12:30 PM]          │   │
│  │ End Time:   [01:20 PM]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Duration: 50 minutes                   │
│                                         │
│  [Delete Slot]  [Cancel]  [Save]        │
└─────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: UI Components
1. Create `TimeEntryModal` component
2. Create `TimeHistoryModal` component
3. Create `EditTimeSlotModal` component
4. Add menu button to Timer card
5. Add modal state management to MultiTimer

### Phase 2: Manual Time Entry
1. Add form validation (start < end, not future, etc.)
2. Implement "Add Time Manually" functionality
3. Create new TimeEvent with manual timestamps
4. Update timer elapsed calculation
5. Persist to localStorage

### Phase 3: Time History View
1. Fetch all TimeEvents for a specific timer
2. Group by date
3. Display in chronological order
4. Show running timer differently
5. Calculate subtotals per day

### Phase 4: Edit Time Slots
1. Load existing TimeEvent
2. Allow editing start/end times
3. Validate changes
4. Update TimeEvent in array
5. Recalculate elapsed time
6. Add delete functionality

### Phase 5: Validation & Edge Cases
1. Prevent overlapping time slots
2. Prevent adding time to running timer
3. Prevent future dates
4. Handle timezone issues
5. Validate time format

---

## Data Structure Changes

### No changes needed to TimeEvent!
The existing structure already supports this:

```typescript
interface TimeEvent {
  id: string;
  groupId: string;
  timerId: string;
  projectName: string;
  taskName: string;
  notes: string;
  startTime: number;      // Unix timestamp
  endTime: number | null; // null if running
}
```

**Why it works:**
- Manual entries are just TimeEvents with past timestamps
- Editing is just updating an existing TimeEvent
- Calculation logic already sums all events

---

## Validation Rules

### Adding Manual Time
1. ✅ Start time must be in the past
2. ✅ End time must be after start time
3. ✅ Cannot add to currently running timer
4. ✅ Date cannot be in the future
5. ⚠️ Warn if overlaps with existing slot (but allow)
6. ✅ Duration must be > 0

### Editing Time Slot
1. ✅ Cannot edit currently running slot (must stop first)
2. ✅ Start time must be before end time
3. ✅ Cannot set future times
4. ⚠️ Warn if creates overlap with other slots

### Deleting Time Slot
1. ✅ Cannot delete currently running slot (must stop first)
2. ✅ Confirm before deleting
3. ✅ Recalculate elapsed time after deletion

---

## User Flow Examples

### Flow 1: Add Time to New Timer
1. User creates new timer (Project 2, Task 2, Note 1)
2. Clicks ⋮ menu → "Add Time Manually"
3. Selects today's date
4. Enters: 9:00 AM - 9:45 AM
5. Clicks "Add Time"
6. Timer now shows 00:45:00

### Flow 2: Add Time to Existing Timer
1. User has timer with 51 minutes
2. Clicks ⋮ menu → "Add Time Manually"
3. Enters: 10:15 AM - 10:26 AM (11 min)
4. Clicks "Add Time"
5. Enters: 10:51 AM - 10:58 AM (7 min)
6. Clicks "Add Time"
7. Timer now shows 01:09:00 (51 + 11 + 7)

### Flow 3: Edit Existing Time Slot
1. User clicks ⋮ menu → "View Time History"
2. Sees slot: 12:30 PM - 2:30 PM (2h)
3. Clicks ✏️ edit icon
4. Changes end time to 1:20 PM
5. Clicks "Save"
6. Timer recalculates to show 50 minutes

---

## Technical Considerations

### 1. Time Zone Handling
- Store all times as UTC timestamps
- Display in user's local timezone
- Use browser's `Date` object for conversions

### 2. Performance
- Filter events by timer ID efficiently
- Cache calculations where possible
- Lazy load time history (don't load until modal opens)

### 3. Conflict Detection
- Check for overlapping time slots
- Show warning but allow (user might have worked on multiple things)
- Highlight overlaps in time history view

### 4. Undo/Redo
- Consider adding undo for deletions
- Store deleted events temporarily
- "Undo" button in toast notification

---

## Next Steps

1. Review and approve UX design
2. Create modal components
3. Implement manual time entry
4. Implement time history view
5. Implement edit functionality
6. Add validation
7. Test edge cases
8. Update documentation

