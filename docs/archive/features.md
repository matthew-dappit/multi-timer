# Features Guide

Complete overview of Multi-Timer features, both current and planned.

---

## Current Features

### ⏱️ Time Tracking

#### Event-Based System (v2.0)
**What It Is:**
Uses timestamp events instead of running counters for perfect accuracy.

**How It Works:**
```typescript
// Each timer session stores exact timestamps
{
  startTime: 1696176000000,  // October 1, 2024, 10:00:00
  endTime: 1696179600000     // October 1, 2024, 11:00:00
}

// Elapsed time calculated from these timestamps
elapsed = endTime - startTime  // Always accurate
```

**Benefits:**
- ✅ Immune to browser throttling
- ✅ Works in inactive tabs
- ✅ Survives computer sleep
- ✅ Accurate to the second

#### Multiple Timers
- Create unlimited timers
- Each timer independent
- Only one can run at a time
- Starting one automatically stops others

#### Time Display
- Format: `HH:MM:SS`
- Real-time updates every second
- Never loses accuracy

### 📁 Project Organization

#### Timer Groups
Organize related timers together:

```
Client A
├── Development
├── Code Review
└── Meetings

Client B
├── Consultation
└── Implementation
```

**Operations:**
- Create new groups
- Rename groups
- Delete groups
- Add timers to groups
- Remove timers from groups

#### Daily Total
- Shows sum of all timer times
- Updates in real-time
- Visible at top of page
- Persists across refreshes

### 💾 Data Persistence

#### LocalStorage
All data automatically saved:
- Timer groups and names
- Task names and notes
- Time events (start/stop history)
- Layout preferences

#### SessionStorage
Running timer state:
- Which timer is active
- When it started
- Resumes on refresh

#### Data Safety
- Survives page refresh
- Survives browser restart
- Survives network issues
- Daily cleanup of old events

### 🎨 User Interface

#### Two Layout Modes

**Standard Mode:**
- Full timer cards
- Task name input
- Notes textarea
- Start/Stop buttons
- Status indicators

**Compact Mode:**
- Smaller cards
- Grid layout
- Click-to-start/stop
- Notes only (no task name)
- More timers visible

#### Visual States

| State | Indicator |
|-------|-----------|
| Running | 🟢 Green dot + Teal ring |
| Stopped | ⚪ Gray dot + No ring |
| Start button | Teal background |
| Stop button | Orange background |

#### Responsive Design
- Desktop: Multi-column grid
- Tablet: 2-column grid
- Mobile: Single column

### 🔐 Authentication

#### User Accounts
- Email/password signup
- Secure JWT authentication
- Session persistence
- Protected routes

#### User Features
- Profile display in navbar
- Secure logout
- Remember session across visits

### 📝 Notes and Context

#### Per-Timer Notes
- Add contextual notes to any timer
- Markdown support (planned)
- Persist across sessions
- Useful for:
  - Task descriptions
  - Meeting notes
  - Context for billing
  - Client instructions

---

## Planned Features

### 📊 Analytics Dashboard

**Target**: Q4 2025

#### Time Visualization
- **Daily Chart**: Bar chart per timer
- **Weekly View**: 7-day comparison
- **Monthly Calendar**: Heatmap of activity
- **Project Breakdown**: Pie chart of time distribution

#### Statistics
- Total time today/week/month
- Average session duration
- Most productive hours
- Longest/shortest sessions
- Time per project
- Billable vs non-billable

#### Implementation Preview
```typescript
// Analytics data structure
interface Analytics {
  daily: { date: string; total: number }[];
  byProject: { projectName: string; total: number }[];
  byHour: number[];  // 24 hours
  sessions: {
    count: number;
    avgDuration: number;
    longest: number;
    shortest: number;
  };
}
```

### 📋 Export and Reporting

**Target**: Q4 2025

#### Export Formats

**CSV Export:**
```csv
Date,Project,Task,Start Time,End Time,Duration
2024-10-01,Client A,Development,10:00:00,11:30:00,1.5
2024-10-01,Client A,Meetings,14:00:00,14:45:00,0.75
```

**PDF Report:**
- Professional formatting
- Company branding
- Client-ready invoices
- Date range filtering

**JSON Backup:**
- Complete data export
- Import on new device
- Backup before upgrades

#### Report Types
- Daily timesheet
- Weekly summary
- Project-specific
- Client billing report
- Custom date ranges

### ⚡ Advanced Time Management

**Target**: Q1 2026

#### Session Editing
- Edit past session times
- Split long sessions
- Merge adjacent sessions
- Delete incorrect sessions
- Add manual entries

#### Timer Templates
- Save timer configurations
- Quick-start common timers
- Duplicate with all settings
- Share templates (team feature)

#### Bulk Operations
- Start/stop multiple timers
- Move timers between groups
- Batch delete
- Batch edit notes

### 🎨 Customization

**Target**: Q1 2026

#### Visual Customization
- Color-code timers
- Custom icons per timer
- Theme selection (light/dark/auto)
- Font size adjustment
- Custom color schemes

#### Display Options
- Hide/show project totals
- Configurable time format
- Decimal hours option
- Custom date formats

### ⌨️ Keyboard Shortcuts

**Target**: Q1 2026

| Shortcut | Action |
|----------|--------|
| `Space` | Start/stop active timer |
| `R` | Reset active timer |
| `N` | Focus notes for active timer |
| `Cmd/Ctrl + T` | New timer |
| `Cmd/Ctrl + G` | New group |
| `Cmd/Ctrl + E` | Export data |
| `Cmd/Ctrl + K` | Command palette |
| `1-9` | Switch to timer N |

### 🔔 Notifications

**Target**: Q2 2026

#### Desktop Notifications
- Timer reaches time goal
- Reminder to start timer
- Reminder to stop running timer
- Daily time goal reached

#### Sound Alerts
- Optional sound on timer start
- Sound when timer stops
- Custom sounds
- Volume control

### 👥 Collaboration Features

**Target**: Q2 2026

#### Team Timers
- Share timers with team members
- See who's working on what
- Team activity feed
- Combined team reports

#### Permissions
- Admin can see all timers
- Team members see own + shared
- Client view (read-only reports)

### 🔗 Integrations

See [Integration Guide](./integrations.md) for details.

**Planned:**
- Zoho Books (Q1 2026)
- ClickUp (Q2 2026)
- Linear (Q2 2026)
- Google Calendar (Future)
- Slack (Future)
- GitHub (Future)

### 📱 Mobile Features

**Target**: Q3 2026

#### Mobile App
- Native iOS app
- Native Android app
- Sync with web app
- Offline support
- Push notifications

#### Mobile Optimizations
- Touch-friendly interface
- Swipe gestures
- Quick timer widgets
- Background timer support

---

## Feature Comparison

### Current (v2.0) vs Planned (v3.0)

| Feature | v2.0 | v3.0 |
|---------|------|------|
| Multiple Timers | ✅ | ✅ |
| Project Groups | ✅ | ✅ Enhanced |
| Time Accuracy | ✅ Event-based | ✅ |
| Notes | ✅ Plain text | ✅ Markdown |
| Persistence | ✅ Local | ✅ Cloud sync |
| Analytics | ❌ | ✅ Full dashboard |
| Export | ❌ | ✅ CSV/PDF/JSON |
| Edit History | ❌ | ✅ Full editing |
| Templates | ❌ | ✅ Save & share |
| Keyboard Shortcuts | ❌ | ✅ Full support |
| Notifications | ❌ | ✅ Desktop & mobile |
| Integrations | ✅ Xano auth | ✅ Zoho, ClickUp, etc |
| Team Features | ❌ | ✅ Collaboration |
| Mobile App | ❌ | ✅ iOS & Android |

---

## Usage Examples

### Freelance Developer

```
Client A Projects
├── Frontend Development (12h 34m)
│   └── "React components for dashboard"
├── Backend API (8h 15m)
│   └── "REST endpoints for auth"
└── Client Calls (2h 30m)
    └── "Weekly planning meeting"

Client B Projects
├── Bug Fixes (3h 45m)
└── Feature Requests (5h 20m)

Total Today: 32h 24m
```

### Agency Team Lead

```
Management
├── Team Meetings (1h 30m)
├── Code Reviews (2h 15m)
└── Planning (1h 00m)

Project Alpha
├── Architecture (3h 45m)
└── Development (4h 20m)

Admin
├── Emails (45m)
└── Documentation (1h 30m)

Total Today: 15h 05m
```

### Design Agency

```
Client Website
├── UI Design (6h 20m)
├── Client Revisions (2h 45m)
└── Asset Creation (3h 15m)

Internal
├── Portfolio Update (1h 30m)
└── Social Media (45m)

Total Today: 14h 35m
```

---

## Technical Capabilities

### Performance

**Current:**
- Handles 100+ timers efficiently
- Sub-second UI updates
- Minimal memory footprint (<10MB)
- Optimized localStorage usage

**At Scale:**
- 1000+ time events: No performance impact
- 50+ active timers: Smooth operation
- Years of history: Efficient filtering

### Browser Support

| Browser | Status |
|---------|--------|
| Chrome 90+ | ✅ Full support |
| Firefox 88+ | ✅ Full support |
| Safari 14+ | ✅ Full support |
| Edge 90+ | ✅ Full support |
| Mobile browsers | ⚠️ Limited testing |

### Storage Limits

| Type | Limit | Usage |
|------|-------|-------|
| LocalStorage | 5-10 MB | ~100KB currently |
| SessionStorage | 5-10 MB | <1KB currently |
| IndexedDB (future) | 50MB+ | Not yet implemented |

---

## Feature Requests

Have an idea? We track feature requests by:

1. **Priority**: High, Medium, Low
2. **Complexity**: Simple, Moderate, Complex
3. **Impact**: How many users benefit

Top requested features:
1. Analytics dashboard
2. Zoho Books integration
3. Export to CSV
4. Edit past sessions
5. Keyboard shortcuts

---

**Last Updated**: October 1, 2025
