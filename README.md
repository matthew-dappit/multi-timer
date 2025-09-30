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
- [x] Connection with GitHub & Vercel
- [x] Consolidated styling with Dappit brand guidelines
  - [x] Implemented Poppins font (primary Dappit typeface)
  - [x] Applied Dappit palette (#202020, #F3F3F3, #01D9B5, #FF7F50)
  - [x] Moved Dappit logos to public folder and created a minimal homepage
  - [x] Configured Tailwind utilities for brand colors
- [x] **Timer Experience**
  - [x] Created Timer component with exclusive start/stop behaviour
  - [x] Added compact and standard layouts with visual active states
  - [x] Exposed task and notes fields per timer, with notes-only compact view
  - [x] Enabled timer cards to run/stop on click in compact mode
- [x] **Timer Management**
  - [x] Restructured state into project-based timer groups
  - [x] Added group-level add/remove actions and per-group timers
  - [x] Enabled responsive grid layouts supporting dense timer rows
  - [x] Added compact mode toggle with streamlined daily total display
- [x] **Timer Persistence**
  - [x] Store timer groups, tasks, notes, and layout preference in `localStorage`
  - [x] Resume in-progress timers across refreshes with `sessionStorage`
  - [x] Guard against corrupt storage payloads with runtime normalisation
- [x] **Shared Layout & Navigation**
  - [x] Root layout wraps pages with branded shell and Navbar
  - [x] Navbar renders logo with home navigation and dark/light support
- [x] **🆕 User Authentication System**
  - [x] Login and signup functionality
  - [x] JWT token-based authentication
  - [x] Protected routes and session management
  - [x] Integration with Xano backend
  - [x] User profile display in navbar
  - [x] Secure logout functionality

## Architecture & Components

### Component Structure
```
src/
├── app/
│   ├── page.tsx          # Home route with protected authentication
│   ├── layout.tsx        # Root layout with AuthProvider and shared shell
│   └── globals.css       # Global styles and Tailwind imports
├── components/
│   ├── Navbar.tsx        # Branded navigation with user info and logout
│   ├── Timer.tsx         # Individual timer component
│   ├── MultiTimer.tsx    # Timer management and daily total
│   ├── AuthForm.tsx      # Login/signup form component
│   └── ProtectedRoute.tsx # Route protection wrapper
├── contexts/
│   └── AuthContext.tsx   # Authentication state management
├── lib/
│   └── auth.ts           # Authentication utilities and API calls
└── .env.local            # Environment variables (not committed)
```

### AuthContext.tsx & auth.ts
**Purpose**: Centralized authentication state management and API integration.
**Key Features**:
- JWT token storage and management
- User session persistence across page refreshes
- Login, signup, and logout functionality
- Protected API request utilities
- Token verification and auto-refresh

### AuthForm.tsx
**Purpose**: Unified login and signup form with validation.
**Key Features**:
- Toggle between login and signup modes
- Form validation (email format, password length)
- Error display and handling
- Loading states during submission
- Responsive design matching app theme

### ProtectedRoute.tsx
**Purpose**: Wrapper component to protect routes requiring authentication.
**Key Features**:
- Checks authentication status
- Shows loading state during verification
- Renders fallback (login form) for unauthenticated users
- Allows authenticated users to access protected content

### Timer.tsx
**Purpose**: Individual stopwatch card that adapts between full and compact views.
**Key Features**:
- Real-time HH:MM:SS display (elapsed time controlled by `MultiTimer`)
- Standard view: task input, notes textarea, and start/stop CTA
- Compact view: clickable card showing elapsed time and notes label only
- Active timer highlights with turquoise ring and coral stop state

**Props**:
- `id`: Unique timer identifier
- `elapsed`: Elapsed time in seconds
- `taskName`, `notes`: Controlled text inputs from parent
- `isCompact`: Switches between card layouts
- `onElapsedChange`, `onTaskChange`, `onNotesChange`
- `onStart`, `onStop`, `isActive`

### MultiTimer.tsx
**Purpose**: Group-based timer manager with compact toggle and daily summary.
**Key Features**:
- Daily total display with dense compact variant
- Project groups containing multiple timers
- Add/remove project groups and timers
- Compact toggle that tightens spacing and switches timer cards
- Responsive grid supporting high timer counts per row

**State Management**:
- `groups`: Array of project objects `{id, projectName, timers[]}`
- `activeTimerId`: Tracks which timer is currently running
- `isCompact`: Global toggle for compact presentation

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

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Xano backend account (authentication is configured)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/matthew-dappit/multi-timer.git
cd multi-timer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and ensure the API base URL is correct:
```
NEXT_PUBLIC_API_BASE_URL=https://api.dappit.org/api:vsVOMFSf
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Time Setup
1. Click "Sign up" to create a new account
2. Enter your details (first name, last name, email, password)
3. You'll be automatically logged in and can start using the timer

### Usage
- **Create Timers**: Click "Add Timer" to create a new timer in a project group
- **Start Timer**: Click the START button or click the timer card (in compact mode)
- **Stop Timer**: Click the STOP button or click the active timer card
- **Add Projects**: Click "Add Project Group" to organize timers by project
- **Toggle Compact Mode**: Use the compact mode button for a streamlined view
- **View Daily Total**: See your total tracked time at the top of the page

## Technical Implementation Details

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

**Data Structures**:
```typescript
interface TimerData {
  id: string;
  taskName: string;
  notes: string;
  elapsed: number;
}

interface TimerGroup {
  id: string;
  projectName: string;
  timers: TimerData[];
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

## Immediate Next Steps

1. ~~Consolidate app styling~~ ✅ **COMPLETED**
2. ~~Create basic stopwatch component~~ ✅ **COMPLETED**
3. ~~Add stopwatch to the homepage~~ ✅ **COMPLETED**
4. ~~Get Today's Total time working~~ ✅ **COMPLETED**
5. Implement timer history and timestamp logging
6. ~~Add local storage persistence for timer state~~ ✅ **COMPLETED**
7. Implement daily total calculation from actual timer sessions
