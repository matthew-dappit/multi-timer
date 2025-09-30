# Multi-Timer

## Context

The six developers at Dappit software development agency bill client work based on hourly rates. This requires tracking time across multiple projects and tasks throughout the day. Having a simple and elegant multi-timer web app with multiple stopwatches for different tasks will be hugely beneficial.

## MVP Requirements

1. Stopwatches work seamlessly: starting or resuming a certain watch pauses all other ones.
2. A central number shows how much time I’ve done for the day, which is the sum of the active watches.
3. The app keeps a history of timestamps when watches were started and stopped, so I can have a breakdown of what I did and when.
4. If I lose internet connection or close the browser, it keeps the progress. If I lose the watches, I lose my billing time for the day. This is another reason why point 3 is important (to store a cache of times stopped and started).

## Future Features

1. Integrate with ClickUp, Linear, or any other project management software to pull tasks in for the day that can give names to the watches.
2. Potentially sync with Zoho Books to make logging the hours easier at the end of the day.

## Work Completed So Far

- [x] Next.js project initialization
- [x] Connection with GitHub
- [x] Connection with Vercel
- [x] Consolidate app styling with Dappit brand guidelines
  - [x] Implemented Poppins font (primary Dappit typeface)
  - [x] Applied Dappit color palette (#202020, #F3F3F3, #01D9B5, #FF7F50)
  - [x] Set up proper typography with recommended letter spacing and line height
  - [x] Moved Dappit logos to public folder
  - [x] Created minimal, professional homepage design
  - [x] Configured Tailwind with Dappit brand colors
- [x] **Core Timer Functionality**
  - [x] Created Timer component with full stopwatch functionality
  - [x] Created MultiTimer component for managing multiple timers
  - [x] Implemented exclusive timer operation (only one runs at a time)
  - [x] Added project and task selection dropdowns
  - [x] Added notes field for detailed work descriptions
  - [x] Added billable time tracking checkbox
  - [x] Integrated timer components into homepage
  - [x] Fixed light/dark mode visibility issues
  - [x] Optimized layout to prevent scrolling
- [x] **Shared Layout & Navigation**
  - [x] Moved branded header into root layout for consistent experience
  - [x] Created reusable Navbar component with home-linking logo

## Architecture & Components

### Component Structure
```
src/
├── app/
│   ├── page.tsx          # Home route rendering the multi-timer dashboard
│   ├── layout.tsx        # Root layout with Poppins font and shared shell
│   └── globals.css       # Global styles and Tailwind imports
├── components/
│   ├── Navbar.tsx        # Branded navigation bar shared across pages
│   ├── Timer.tsx         # Individual timer component
│   └── MultiTimer.tsx    # Timer management and daily total
```

### Timer.tsx
**Purpose**: Individual stopwatch component with project tracking
**Key Features**:
- Real-time HH:MM:SS timer display (elapsed time is now managed by the parent `MultiTimer` component)
- Project name dropdown (Dappit Internal, Client Projects, Marketing, etc.)
- Task name dropdown (Development, Code Review, Testing, etc.)
- Notes textarea for work details
- Billable checkbox (default: checked)
- START/STOP button with color-coded states
- Visual status indicator (running/stopped)

**Props**:
- `id`: Unique timer identifier
- `elapsed`: Elapsed time in seconds (controlled by parent)
- `onElapsedChange`: Callback to update elapsed time in parent
- `onStart`: Callback when timer starts
- `onStop`: Callback when timer stops
- `isActive`: Boolean indicating if this timer is the active one

### MultiTimer.tsx
**Purpose**: Manages multiple Timer components, enforces exclusive operation, and now centrally manages all timer state.
**Key Features**:
- Daily total time display (sum of all timers, live-updating and accurate)
- Add/remove timer functionality
- Ensures only one timer runs at a time
- Responsive grid layout for multiple timers
- User instructions and guidance

**State Management**:
- `timers`: Array of timer data objects, each with `id`, `name`, and `elapsed` (seconds)
- `activeTimerId`: ID of currently running timer
- `totalDailyTime`: Computed as the sum of all timers' `elapsed` values

### Layout.tsx & Navbar.tsx
**Purpose**: Supply the shared application chrome, typography, and navigation.
**Key Features**:
- Applies the Poppins font globally and wraps all pages with the branded background shell
- Renders `<Navbar />` above page content so every route shares the same header
- Navbar swaps between light and dark logos and links back to `/` when the logo is clicked

### Component Interaction Flow
1. **User starts Timer A**: `Timer.tsx` calls `onStart(id)` → `MultiTimer.tsx` sets `activeTimerId`
2. **User starts Timer B**: `MultiTimer.tsx` automatically sets Timer A's `isActive` to false
3. **Timer A stops**: React effect in `Timer.tsx` detects `!isActive` and stops the timer
4. **Timer B becomes active**: Only Timer B continues counting
5. **Timer increments**: Each second, `Timer.tsx` calls `onElapsedChange(id, newElapsed)` to update the parent, which updates the timer's `elapsed` value in state.
6. **Today's Total**: `MultiTimer.tsx` always displays the sum of all timers' `elapsed` values, live-updating as timers run.

### Technical Implementation Details

**Timer State Management**:
- All timer elapsed time state is managed in the parent `MultiTimer` component.
- Each Timer receives its `elapsed` value and a callback to update it from the parent.
- Timer counting uses `setInterval` in the child, but updates the parent state every second.
- React `useEffect` hooks manage timer lifecycle and cleanup.

**Exclusive Operation Logic**:
- MultiTimer maintains `activeTimerId` state
- When a timer starts, MultiTimer sets `activeTimerId` to that timer's ID
- All other timers receive `isActive: false` and automatically stop
- Only the active timer's interval continues running

**UI/UX Features**:
- Color-coded buttons: Turquoise (#01D9B5) for START, Coral (#FF7F50) for STOP
- Visual status indicators with colored dots
- Responsive design with CSS Grid for multiple timers
- Dark/light mode support with proper contrast
- Inline styles used for custom Dappit colors to ensure visibility

**Form Data Structure**:
```typescript
interface TimerData {
  id: string;
  name: string;
  // Future: projectName, taskName, notes, billable, timeEntries
}
```

## MVP Status

### ✅ Completed Requirements
1. **Exclusive timer operation**: ✅ Starting any timer pauses all others
2. **Daily total display**: ✅ Central display shows cumulative time (now live and correct)
3. **Project/task tracking**: ✅ Dropdown fields for organization
4. **Professional design**: ✅ Dappit brand colors and responsive layout

### 🔄 In Progress Requirements
3. **Timer history**: Storage of start/stop timestamps
4. **Persistence**: Maintaining timer state across browser sessions

## Immediate Next Steps

1. ~~Consolidate app styling~~ ✅ **COMPLETED**
2. ~~Create basic stopwatch component~~ ✅ **COMPLETED**
3. ~~Add stopwatch to the homepage~~ ✅ **COMPLETED**
4. ~~Get Today's Total time working~~ ✅ **COMPLETED**
5. Implement timer history and timestamp logging
6. Add local storage persistence for timer state
7. Implement daily total calculation from actual timer sessions
