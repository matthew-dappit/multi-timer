# Quick Start Guide

Get the Multi-Timer application up and running in minutes.

## Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn**
- **Git** (for cloning the repository)
- **Xano account** (for authentication features)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/matthew-dappit/multi-timer.git
cd multi-timer
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Other project dependencies

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Xano configuration:

```env
NEXT_PUBLIC_XANO_API_URL=https://your-workspace.xano.io/api:your-branch
NEXT_PUBLIC_XANO_AUTH_TOKEN=your-auth-token
```

**Getting Xano Credentials:**
1. Sign up at [xano.com](https://xano.com)
2. Create a new workspace
3. Set up authentication endpoints
4. Copy your API URL and authentication token

### 4. Run Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

---

## First Time Setup

### Creating Your First Account

1. Open `http://localhost:3000` in your browser
2. You'll see the login/signup form
3. Click "Create an account"
4. Fill in:
   - First Name
   - Last Name
   - Email
   - Password (minimum 6 characters)
5. Click "Sign Up"

You'll be automatically logged in and see the timer interface.

### Creating Your First Timer

1. You'll see a default "Project 1" group with one timer
2. Click the input field and enter a project name (e.g., "Client Work")
3. Click "Add Timer" to create additional timers
4. Enter task names for each timer (e.g., "Development", "Meetings")

### Starting a Timer

**Standard Mode:**
1. Click the "Start" button on any timer
2. The timer turns teal and begins counting
3. Starting another timer automatically stops the first one

**Compact Mode:**
1. Toggle "Compact Mode" in the top right
2. Click anywhere on a timer card to start/stop it
3. View notes by hovering or clicking

---

## Understanding the Interface

### Main Elements

```
┌─────────────────────────────────────┐
│         Today's Total               │
│           02:34:15                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Project: Client A        [Add Timer]│
├─────────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐           │
│ │ Timer 1 │  │ Timer 2 │           │
│ │00:45:30 │  │01:15:20 │           │
│ │[Stop]   │  │[Start]  │           │
│ └─────────┘  └─────────┘           │
└─────────────────────────────────────┘
```

### Timer States

- **🟢 Green Dot + Teal Ring** - Timer is running
- **⚪ Gray Dot + No Ring** - Timer is stopped
- **Teal Button** - Start/Resume
- **Orange Button** - Stop

### Daily Total

Shows the sum of all timer elapsed times across all projects.

---

## Common Tasks

### Managing Projects

**Add a Project Group:**
```
Click "Add Project Group" → Enter project name
```

**Rename a Project:**
```
Click the project name field → Edit → Press Enter
```

**Remove a Project:**
```
Click "Remove" button (only if you have multiple projects)
```

### Managing Timers

**Add a Timer:**
```
Click "Add Timer" within a project group
```

**Add Notes:**
```
Click the notes textarea → Type your notes → Click outside
```

**Remove a Timer:**
```
Click the X button in the top-right of the timer card
```

### Layout Options

**Switch to Compact Mode:**
```
Click "Compact Mode" button in the top bar
```

**Benefits:**
- See more timers at once
- Quick start/stop by clicking cards
- Cleaner interface

**Return to Standard Mode:**
```
Click "Exit Compact" button
```

---

## Data Persistence

### What Gets Saved

Your data is automatically saved to your browser's LocalStorage:

- ✅ Timer groups and names
- ✅ Task names and notes
- ✅ All time events (start/stop timestamps)
- ✅ Layout preference (compact/standard)
- ✅ Running timer state (sessionStorage)

### What Happens When...

**You refresh the page:**
- ✅ All data restored
- ✅ Running timer resumes correctly
- ✅ Accurate elapsed time maintained

**You close the browser:**
- ✅ Data persists (localStorage)
- ⚠️ Running timer stops (sessionStorage cleared)
- ✅ Elapsed time preserved

**You switch devices:**
- ❌ Data is local to each browser
- 📋 Future: Cloud sync planned

### Clearing Data

To reset the application:

**Clear All Timers:**
```javascript
// Open browser console (F12)
localStorage.removeItem('multi-timer/state');
localStorage.removeItem('multi-timer/time-events');
sessionStorage.removeItem('multi-timer/running');
// Refresh page
```

**Clear Only Today's Events:**
Events are automatically filtered to show only today's data on page load.

---

## Keyboard Shortcuts

(Planned feature - not yet implemented)

| Shortcut | Action |
|----------|--------|
| `Space` | Start/stop active timer |
| `N` | Add note to active timer |
| `Cmd/Ctrl + T` | New timer |
| `Cmd/Ctrl + G` | New group |

---

## Troubleshooting

### Timer Not Starting

**Symptom:** Click start but nothing happens

**Solutions:**
1. Check browser console for errors (F12)
2. Verify localStorage is enabled in browser settings
3. Clear application data and refresh

### Time Not Accurate

**Symptom:** Timer shows wrong elapsed time

**Solutions:**
1. This was fixed in v2.0 with event-based tracking
2. Ensure you're on the latest version
3. If issue persists, check browser console for errors

### Login Not Working

**Symptom:** Can't log in or signup

**Solutions:**
1. Verify `.env.local` has correct Xano URL
2. Check Xano backend is accessible
3. Ensure email format is valid
4. Password must be 6+ characters

### Data Not Persisting

**Symptom:** Lose data on refresh

**Solutions:**
1. Check if localStorage is enabled
2. Verify you're not in private/incognito mode
3. Check browser storage quota

### App Performance Issues

**Symptom:** Slow or laggy interface

**Solutions:**
1. Check number of time events (view in localStorage)
2. Clear old events: `localStorage.removeItem('multi-timer/time-events')`
3. Reduce number of active timers
4. Use compact mode for better performance

---

## Next Steps

Now that you have the app running:

1. **Read the [Features Guide](./features.md)** - Learn about all capabilities
2. **Review [Architecture](./architecture.md)** - Understand how it works
3. **Check [Development Guide](./development.md)** - For customization
4. **See [Integrations](./integrations.md)** - Connect with other tools

---

## Getting Help

If you run into issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review the [Architecture documentation](./architecture.md)
3. Check browser console for error messages
4. Contact the Dappit development team

---

**Happy Time Tracking! ⏱️**

---

**Last Updated**: October 1, 2025
