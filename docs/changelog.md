# Changelog

All notable changes to the Multi-Timer project.

## [2.0.0] - October 1, 2025

### 🎉 Major Update: Event-Based Time Tracking

#### Fixed
- **Timer Accuracy Issue** - Timers now show accurate elapsed time
  - Previous issue: Timer showed 4:43 when real time was 20:06
  - Root cause: `startedAt` timestamp was being reset every second
  - Solution: Implemented event-based time tracking using timestamps

#### Added
- **Time Event System**
  - Store start/stop timestamps for each timer session
  - Calculate elapsed time from actual timestamps
  - Immune to browser throttling and inactive tabs
  - Complete audit trail for billing accuracy
  
- **Event History**
  - All timer sessions stored as time events
  - Foundation for analytics and reporting
  - Can reconstruct any timer's complete history
  
#### Changed
- **Timer Component** - Simplified to pure presentation
  - Removed internal interval and time calculation logic
  - Now receives elapsed time from parent component
  - Cleaner, more maintainable code

- **MultiTimer Component** - Enhanced state management
  - Added `timeEvents` state for storing session history
  - Recalculates elapsed time from events every second
  - Automatic cleanup of old events (keeps only today's data)

- **Storage Schema**
  - Added `multi-timer/time-events` localStorage key
  - Events filtered to current day on load
  - Prevents unbounded data growth

#### Technical Details
```typescript
// New TimeEvent interface
interface TimeEvent {
  id: string;
  groupId: string;
  timerId: string;
  startTime: number;       // Timestamp when started
  endTime: number | null;  // Timestamp when stopped (null if running)
  taskName: string;
  projectName: string;
}
```

---

## [1.2.0] - September 30, 2025

### Added
- **User Authentication System**
  - Login and signup functionality
  - JWT token-based authentication
  - Protected routes with ProtectedRoute component
  - User profile display in navbar
  - Secure logout functionality
  
- **Xano Backend Integration**
  - Authentication API endpoints
  - User session management
  - Token storage and verification

#### New Files
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/lib/auth.ts` - Authentication utilities and API calls
- `src/components/AuthForm.tsx` - Login/signup form component
- `src/components/ProtectedRoute.tsx` - Route protection wrapper

#### Changed
- `src/components/Navbar.tsx` - Added user info and logout button
- `src/app/layout.tsx` - Wrapped with AuthProvider
- `src/app/page.tsx` - Wrapped with ProtectedRoute

---

## [1.1.0] - September 2025

### Added
- **Timer Persistence**
  - localStorage for timer groups, tasks, and notes
  - sessionStorage for running timer state
  - Automatic resume of running timers on refresh
  - Data validation and normalization

- **Compact Mode**
  - Toggle between standard and compact layouts
  - Streamlined daily total display
  - Click-to-start/stop timers in compact mode
  - Responsive grid layouts

#### Changed
- Restructured state into project-based timer groups
- Added group-level add/remove actions
- Enhanced responsive grid layouts

---

## [1.0.0] - September 2025

### Added
- **Core Timer Functionality**
  - Multiple simultaneous timers
  - Exclusive timer running (start one, others stop)
  - Task name and notes per timer
  - Real-time elapsed time display (HH:MM:SS)
  
- **Project Organization**
  - Group timers by project
  - Add/remove project groups
  - Add/remove timers within groups
  
- **User Interface**
  - Clean, modern design
  - Dappit brand styling (colors, fonts)
  - Visual active state indicators
  - Responsive layout
  
- **Daily Total**
  - Sum of all timer elapsed times
  - Prominent display at top of page
  
#### Initial Files
- `src/components/Timer.tsx` - Individual timer component
- `src/components/MultiTimer.tsx` - Main container
- `src/components/Navbar.tsx` - Navigation bar
- `src/app/page.tsx` - Home page
- `src/app/layout.tsx` - Root layout
- `src/app/globals.css` - Global styles with Tailwind

---

## [0.1.0] - August 2025

### Added
- **Project Initialization**
  - Next.js 14 setup with App Router
  - TypeScript configuration
  - Tailwind CSS setup
  - Dappit brand guidelines implementation
    - Poppins font integration
    - Brand color palette (#202020, #F3F3F3, #01D9B5, #FF7F50)
    - Dappit logos in public folder
  
- **Deployment**
  - GitHub repository created
  - Vercel deployment configured
  - CI/CD pipeline established

---

## Upgrade Guide

### Upgrading to 2.0.0 from 1.x

The event-based time tracking system is **backward compatible**. Your existing timers will continue to work:

1. Old `elapsed` values are preserved
2. First time a timer starts, it creates its first TimeEvent
3. Subsequent starts/stops use the new event system
4. No data migration required

**What You'll Notice:**
- Timer accuracy improves dramatically
- Time tracking works correctly in inactive tabs
- LocalStorage includes new `multi-timer/time-events` key

**Optional Cleanup:**
If you want to start fresh with the new system:
```javascript
// Clear old data (optional)
localStorage.removeItem('multi-timer/state');
localStorage.removeItem('multi-timer/time-events');
sessionStorage.removeItem('multi-timer/running');
```

---

## Roadmap

### Version 2.1.0 (Planned)
- Analytics dashboard with charts
- Export functionality (CSV, PDF)
- Edit/delete past time events
- Session statistics

### Version 2.2.0 (Planned)
- Zoho Books integration for billing
- ClickUp/Linear integration for tasks
- Project templates
- Recurring tasks

### Version 3.0.0 (Future)
- Team collaboration features
- Real-time sync across devices
- Mobile app
- Advanced reporting

---

**Version Numbering:**
- Major (X.0.0): Breaking changes or major features
- Minor (0.X.0): New features, backward compatible
- Patch (0.0.X): Bug fixes and minor improvements

**Last Updated**: October 1, 2025
