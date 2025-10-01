# Multi-Timer

A time tracking application for development agencies to accurately track billable hours across multiple projects and tasks.

## 📖 Documentation

**👉 [Full Documentation](./docs/README.md)**

- **[Quick Start Guide](./docs/quick-start.md)** - Get up and running in minutes
- **[Architecture](./docs/architecture.md)** - Technical implementation details
- **[Features](./docs/features.md)** - Current capabilities and roadmap
- **[Changelog](./docs/changelog.md)** - Version history and updates
- **[Integration Guide](./docs/integrations.md)** - Third-party integrations

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to start tracking time.

## ✨ Key Features

- ⏱️ **Event-Based Time Tracking** - Accurate to the second, immune to browser throttling
- 📁 **Project Organization** - Group timers by project or client
- 💾 **Persistent State** - Never lose your time data
- 🔐 **User Authentication** - Secure user accounts
- 📊 **Complete History** - Audit trail for billing accuracy

## 🎯 MVP Requirements

## 🎯 MVP Requirements

- [x] **Exclusive Timer Behavior** - Starting one timer automatically stops others
- [x] **Daily Total** - Central display showing total time tracked
- [x] **Timestamp History** - Complete record of start/stop events for billing
- [x] **Persistent State** - Data survives browser refresh, closure, and network issues

## 🏗️ Built With

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Xano** - Backend authentication
- **Vercel** - Deployment platform

## 📱 Current Status

**Version**: 2.0.0 (Event-Based Time Tracking)  
**Last Updated**: October 1, 2025

### ✅ Completed
- Event-based time tracking system (v2.0)
- User authentication and protected routes
- Multiple timer groups and timers
- LocalStorage persistence
- Compact and standard layouts
- Timer accuracy fix (immune to browser throttling)

### 🚧 In Progress
- Analytics dashboard
- Time export functionality

### 📋 Planned
- Zoho Books integration for billing
- ClickUp/Linear task integration
- Team collaboration features

See [Changelog](./docs/changelog.md) for detailed version history.

## 🤝 Contributing

This is a proprietary project for Dappit Software. For questions or contributions, contact the development team.

---

**Made with ⏱️ by Dappit Software**

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
