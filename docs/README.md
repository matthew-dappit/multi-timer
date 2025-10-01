# Multi-Timer Application Documentation

A time tracking application for development agencies to track billable hours across multiple projects and tasks.

## 📚 Documentation Index

### Getting Started
- **[Quick Start Guide](./quick-start.md)** - Installation and first-time setup
- **[Development Guide](./development.md)** - Local development and deployment

### Core Documentation
- **[Architecture](./architecture.md)** - System design and technical implementation
- **[Features](./features.md)** - Current capabilities and roadmap
- **[API Reference](./api-reference.md)** - Component props and utility functions

### Guides
- **[Authentication Guide](./authentication.md)** - User authentication system
- **[Integration Guide](./integrations.md)** - Third-party integrations (Zoho, ClickUp, etc.)

### Technical Details
- **[Changelog](./changelog.md)** - Version history and updates

---

## Quick Overview

### What is Multi-Timer?

Multi-Timer is a web application designed for development agencies to track billable hours across multiple projects and tasks simultaneously. It features:

- ⏱️ **Event-Based Time Tracking** - Accurate to the second, immune to browser throttling
- 📁 **Project Organization** - Group timers by project or client
- 💾 **Persistent State** - Never lose your time data
- 🔐 **User Authentication** - Secure user accounts with Xano backend
- 📊 **Complete History** - Audit trail of all work sessions

### Key Concepts

#### Time Event System
Instead of simple counters, Multi-Timer stores timestamp events:

```typescript
{
  startTime: 1696176000000,  // When timer started
  endTime: 1696179600000     // When timer stopped (or null if running)
}
```

This approach provides:
- Perfect accuracy regardless of browser state
- Complete audit trail for billing
- Foundation for analytics and reporting

#### Project Groups
Organize timers into groups representing projects or clients:

```
Client A
├── Feature Development (2h 34m)
├── Code Review (45m)
└── Meetings (1h 15m)

Client B
├── Bug Fixes (1h 20m)
└── Consultation (30m)
```

---

## Project Context

### The Problem
Dappit, a 6-developer agency, bills clients hourly. Developers need to:
- Track time across multiple concurrent projects
- Switch between tasks without losing time
- Have accurate records for billing
- Never lose data due to browser issues

### The Solution
A single-page web app with:
1. Multiple simultaneous timers (only one running at a time)
2. Daily total showing all tracked time
3. Complete timestamp history for billing accuracy
4. Robust persistence (survives refreshes, crashes, etc.)

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser
- Xano account (for authentication)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/matthew-dappit/multi-timer.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Xano credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

See [Quick Start Guide](./quick-start.md) for detailed instructions.

---

## Current Status

### ✅ Completed Features
- Multiple simultaneous timers with exclusive running state
- Project-based timer groups
- Notes and task names per timer
- Compact and standard layouts
- LocalStorage persistence
- SessionStorage for running timers
- User authentication (login/signup/logout)
- Protected routes
- Event-based time tracking system
- Accurate timing immune to browser throttling

### 🚧 In Progress
- Analytics dashboard
- Time event visualization
- Export functionality (CSV/PDF)

### 📋 Planned Features
- Zoho Books integration for billing
- ClickUp/Linear integration for task sync
- Team collaboration features
- Mobile app

---

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Xano (authentication & data storage)
- **Deployment**: Vercel
- **State Management**: React Context + LocalStorage

---

## Project Structure

```
multi-timer/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page (protected)
│   │   ├── layout.tsx            # Root layout with auth
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── MultiTimer.tsx        # Main timer container
│   │   ├── Timer.tsx             # Individual timer
│   │   ├── Navbar.tsx            # Navigation with user info
│   │   ├── AuthForm.tsx          # Login/signup form
│   │   └── ProtectedRoute.tsx    # Route protection
│   ├── contexts/
│   │   └── AuthContext.tsx       # Auth state management
│   └── lib/
│       └── auth.ts               # Auth utilities
├── docs/                          # Documentation (you are here)
├── public/                        # Static assets
└── README.md                      # Project overview
```

---

## Contributing

When contributing to this project:

1. **Follow TypeScript best practices** - Properly type all functions and components
2. **Update documentation** - Keep docs in sync with code changes
3. **Test timer accuracy** - Verify time tracking works correctly
4. **Maintain persistence** - Ensure LocalStorage schema remains compatible

---

## Support

For questions or issues:
- Check the [Quick Start Guide](./quick-start.md)
- Review [Architecture documentation](./architecture.md)
- Contact the development team at Dappit

---

**Version**: 2.0.0 (Event-Based Time Tracking)  
**Last Updated**: October 1, 2025  
**License**: Proprietary (Dappit Software)
