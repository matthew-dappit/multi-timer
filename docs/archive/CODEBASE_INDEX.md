# Multi-Timer Codebase Documentation Index

## Quick Navigation

**Start here for understanding the current implementation:**
1. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Comprehensive overview of all systems
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Visual diagrams and state flow
3. **[FILE_STRUCTURE_GUIDE.md](FILE_STRUCTURE_GUIDE.md)** - File layout and quick reference

---

## Documentation Overview

### Core Implementation Docs (NEW)

#### IMPLEMENTATION_SUMMARY.md
14-section deep dive into the entire codebase:
- Timer state management & data structures
- Storage architecture (localStorage/sessionStorage)
- Timer start/stop mechanisms
- Elapsed time calculation
- Time entry & history management
- Project & task integration
- API integration patterns
- Component architecture
- Key features & behaviors
- Environment configuration
- Data validation & normalization
- UI state management
- Performance optimizations
- Known limitations & patterns

**Best for:** Understanding how everything works together

#### ARCHITECTURE.md
Visual diagrams and flow charts:
- Component hierarchy
- Data model structure
- Storage architecture
- Timer lifecycle (start → running → stop)
- Data persistence flow
- API integration flow
- Elapsed time calculation algorithm
- Modal state interactions
- Key constraints
- Normalization patterns

**Best for:** Visualizing the system architecture

#### FILE_STRUCTURE_GUIDE.md
File-by-file reference guide:
- Directory layout with descriptions
- Component responsibilities
- State variables reference
- Storage keys reference
- Data flow examples (3 common scenarios)
- Normalization functions
- API endpoints
- Environment variables
- Common patterns
- Quick task reference
- Testing checklist

**Best for:** Finding files, understanding components, solving specific problems

---

### Existing Documentation (Reference)

#### features.md
High-level feature overview
- Timer functionality
- Project/task management
- Time history
- Manual time entry

#### integrations.md
Zoho CRM integration details
- OAuth flow
- Project/task sync
- API endpoints

#### zoho-integration.md
Detailed Zoho integration guide
- OAuth configuration
- API structure
- Field mappings

#### authentication.md
User authentication system
- Login/signup flows
- Token management
- Auth context

#### development.md
Development guide
- Setup instructions
- Local environment
- Testing
- Common tasks

#### quick-start.md
Quick start guide for new developers
- Project overview
- Setup
- Basic functionality

---

## Key Files Reference

### State Management
- `src/components/MultiTimer.tsx` - Main state hub (1,528 lines)
  - All timer logic
  - Storage persistence
  - API integration
  - Real-time updates

### Components
- `src/components/Timer.tsx` - Individual timer display
- `src/components/TimeEntryModal.tsx` - Manual time entry form
- `src/components/TimeHistoryModal.tsx` - Time history view
- `src/components/EditTimeSlotModal.tsx` - Edit time events
- `src/components/ProjectPicker.tsx` - Project selector

### Libraries
- `src/lib/auth.ts` - Authentication utilities
- `src/lib/zoho-oauth.ts` - Zoho OAuth integration

### Context
- `src/contexts/AuthContext.tsx` - Auth state provider

---

## Common Tasks & Where to Find Info

### "I need to understand how timers work"
→ Start: [IMPLEMENTATION_SUMMARY.md - Section 3](IMPLEMENTATION_SUMMARY.md#3-timer-startstop-mechanism)

### "How does elapsed time get calculated?"
→ [ARCHITECTURE.md - Elapsed Time Calculation](ARCHITECTURE.md#elapsed-time-calculation)
→ [IMPLEMENTATION_SUMMARY.md - Section 4](IMPLEMENTATION_SUMMARY.md#4-elapsed-time-calculation)

### "Where is data stored?"
→ [ARCHITECTURE.md - Storage Architecture](ARCHITECTURE.md#storage-architecture)
→ [IMPLEMENTATION_SUMMARY.md - Section 2](IMPLEMENTATION_SUMMARY.md#2-storage-architecture)

### "How do I add a new feature?"
→ [FILE_STRUCTURE_GUIDE.md - Quick Task Reference](FILE_STRUCTURE_GUIDE.md#quick-task-reference)

### "What are the API endpoints?"
→ [FILE_STRUCTURE_GUIDE.md - API Endpoints](FILE_STRUCTURE_GUIDE.md#api-endpoints)

### "How does project/task loading work?"
→ [IMPLEMENTATION_SUMMARY.md - Section 6](IMPLEMENTATION_SUMMARY.md#6-project--task-integration)

### "Where is the authentication logic?"
→ [authentication.md](authentication.md)
→ `src/lib/auth.ts` and `src/contexts/AuthContext.tsx`

### "How does Zoho OAuth integration work?"
→ [IMPLEMENTATION_SUMMARY.md - Section 7](IMPLEMENTATION_SUMMARY.md#7-api-integration-patterns)
→ [zoho-integration.md](zoho-integration.md)

### "What needs testing?"
→ [FILE_STRUCTURE_GUIDE.md - Testing Checklist](FILE_STRUCTURE_GUIDE.md#testing-checklist)

---

## Data Model Quick Reference

### TimerData
Individual timer within a group
```typescript
{
  id: string
  taskId: string | null        // Zoho task ID
  taskName: string             // Display name
  notes: string                // User notes
  elapsed: number              // Seconds (calculated)
}
```

### TimerGroup
Project-level container
```typescript
{
  id: string
  projectId: string | null     // Zoho project ID
  projectName: string          // Display name
  timers: TimerData[]
}
```

### TimeEvent
Immutable time record
```typescript
{
  id: string
  groupId: string
  timerId: string
  projectName: string          // Snapshot
  taskName: string             // Snapshot
  notes: string                // Snapshot
  startTime: number            // ms
  endTime: number | null       // null if running
}
```

### RunningSession
Active timer tracking
```typescript
{
  timerId: string
  groupId: string
  eventId: string
  startTime: number            // ms
}
```

---

## Storage Keys Quick Reference

| Key | Type | Persistence |
|-----|------|-------------|
| `multi-timer/state` | `{groups, isCompact}` | localStorage |
| `multi-timer/time-events` | `TimeEvent[]` | localStorage |
| `multi-timer/running` | `RunningSession\|null` | sessionStorage |
| `multi-timer-auth-token` | string | localStorage |
| `multi-timer-user` | User (JSON) | localStorage |

---

## API Endpoints Quick Reference

### Projects & Tasks
```
GET /zoho_projects     (Bearer token required)
GET /zoho_tasks        (Bearer token required)
```

### Authentication
```
POST /auth/login       (email, password)
POST /auth/signup      (email, password, first_name, last_name)
GET /auth/me           (Bearer token required)
```

### Zoho OAuth
```
GET /zoho/oauth/initiate      (Bearer token required)
POST /zoho/oauth/callback     (code, state, location?, accounts_server?)
GET /zoho/oauth/status        (Bearer token required)
DELETE /zoho/oauth/disconnect (Bearer token required)
```

---

## Reading Order Recommendations

### For New Developers
1. [quick-start.md](quick-start.md) - Overview & setup
2. [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Systems overview
3. [FILE_STRUCTURE_GUIDE.md](FILE_STRUCTURE_GUIDE.md) - Find files & components
4. [ARCHITECTURE.md](ARCHITECTURE.md) - Understand flows

### For Modifying Timer Logic
1. [ARCHITECTURE.md - Timer Lifecycle](ARCHITECTURE.md#timer-lifecycle)
2. [IMPLEMENTATION_SUMMARY.md - Section 3](IMPLEMENTATION_SUMMARY.md#3-timer-startstop-mechanism)
3. [FILE_STRUCTURE_GUIDE.md - MultiTimer Reference](FILE_STRUCTURE_GUIDE.md#multitimertsx-state-hub)

### For Adding Features
1. [FILE_STRUCTURE_GUIDE.md - Quick Task Reference](FILE_STRUCTURE_GUIDE.md#quick-task-reference)
2. Relevant component docs
3. [development.md](development.md)

### For Understanding State
1. [ARCHITECTURE.md - Data Model](ARCHITECTURE.md#data-model)
2. [IMPLEMENTATION_SUMMARY.md - Section 1](IMPLEMENTATION_SUMMARY.md#1-timer-state-management--data-structures)
3. [FILE_STRUCTURE_GUIDE.md - Storage Keys](FILE_STRUCTURE_GUIDE.md#storage-keys-reference)

---

## Version History

### Current Implementation (Oct 2024)
- Multi-timer with groups and tasks
- localStorage persistence
- Real-time elapsed calculation
- Manual time entry
- Zoho CRM integration (OAuth)
- Project/task loading
- Compact mode toggle

### Recent Changes
- Added manual time entry support
- Enhanced time history modal
- Improved elapsed time calculation
- Zoho OAuth integration

---

## Environment Setup

Required environment variables:
```bash
NEXT_PUBLIC_AUTH_API_BASE_URL
NEXT_PUBLIC_WEBAPP_API_BASE_URL
NEXT_PUBLIC_ZOHO_OAUTH_API_BASE_URL
```

See `.env.example` for template.

---

## Key Constraints & Patterns

1. **Single Running Timer**: Only one timer globally active
2. **Today's Data Only**: Only today's events loaded on mount
3. **Snapshot Data**: Events store copies of project/task names
4. **ID Normalization**: All IDs converted to strings
5. **Real-time Updates**: 1-second interval when timer running
6. **Immutable Events**: TimeEvent records never change (only deleted)

---

## Performance Notes

- Event filtering to today reduces initial load
- Real-time interval only runs when timer active
- useMemo optimization for task filtering
- Immutable event records prevent bugs
- localStorage persistence (not API sync)

---

## Next Steps

For maintaining and extending this codebase:
1. Reference the appropriate docs above
2. Check the relevant component/section
3. Follow the patterns documented
4. Test against the checklist
5. Update docs when adding features

---

**Last Updated:** October 16, 2024
**Created by:** Claude Code (Anthropic)
**Status:** Ready for development
