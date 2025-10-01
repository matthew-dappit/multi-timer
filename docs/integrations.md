# Integration Guide

This document covers current and planned integrations with third-party services.

---

## Current Integrations

### Xano Backend (Authentication)

**Status**: ✅ Implemented

#### What It Does
- User authentication (login/signup)
- JWT token management
- Session persistence

#### Setup

1. Create a Xano account at [xano.com](https://xano.com)

2. Set up authentication endpoints in Xano:
   - `POST /auth/signup` - User registration
   - `POST /auth/login` - User login
   - `GET /auth/me` - Get current user info

3. Configure environment variables:
```env
NEXT_PUBLIC_XANO_API_URL=https://your-workspace.xano.io/api:your-branch
NEXT_PUBLIC_XANO_AUTH_TOKEN=your-auth-token
```

4. Test authentication:
```typescript
import { login } from '@/lib/auth';

const user = await login('user@example.com', 'password');
```

#### API Reference

See `src/lib/auth.ts` for complete implementation:
- `login(email, password)` - Authenticate user
- `signup(userData)` - Register new user
- `verifyToken(token)` - Validate JWT token
- `logout()` - Clear authentication

---

## Planned Integrations

### Zoho Books (Billing)

**Status**: 📋 Planned  
**Priority**: High  
**Target**: Q1 2026

#### Goals
- Sync time entries to Zoho Books
- Map timers to Zoho projects/tasks
- Automatic invoice preparation
- Billable vs non-billable tracking

#### Implementation Plan

**Phase 1: OAuth Setup**
```typescript
// OAuth 2.0 configuration
const zohoConfig = {
  clientId: process.env.ZOHO_CLIENT_ID,
  clientSecret: process.env.ZOHO_CLIENT_SECRET,
  redirectUri: 'https://app.example.com/oauth/zoho/callback',
  scopes: [
    'ZohoBooks.projects.READ',
    'ZohoBooks.projects.CREATE',
    'ZohoBooks.timesheets.CREATE',
  ]
};
```

**Phase 2: Project Mapping**
```typescript
interface ZohoProject {
  id: string;
  name: string;
  customerId: string;
  tasks: ZohoTask[];
}

// Map Multi-Timer groups to Zoho projects
const mappings = {
  'group-1': { zohoProjectId: 'proj-123', zohoTaskId: 'task-456' }
};
```

**Phase 3: Time Entry Sync**
```typescript
// Convert TimeEvent to Zoho time entry
const syncTimeEntry = async (event: TimeEvent) => {
  const duration = (event.endTime! - event.startTime) / 1000 / 3600; // hours
  
  await zohoBooks.createTimeEntry({
    projectId: mapping.zohoProjectId,
    taskId: mapping.zohoTaskId,
    userId: currentUser.zohoUserId,
    date: new Date(event.startTime),
    hours: duration,
    notes: event.taskName,
  });
};
```

#### Required Backend Changes
- Store Zoho OAuth tokens per user
- Create sync queue for time entries
- Handle Zoho API rate limits (100 req/min)
- Implement conflict resolution

#### User Experience
```
Timer Interface
    ↓
"Sync to Zoho" button
    ↓
Select Zoho Project
    ↓
Map to Zoho Task
    ↓
Sync time entries
    ↓
Show sync status
```

---

### ClickUp (Task Management)

**Status**: 📋 Planned  
**Priority**: Medium  
**Target**: Q2 2026

#### Goals
- Pull tasks from ClickUp
- Auto-create timers for tasks
- Update task time tracked
- Link timer notes to task comments

#### Implementation Plan

**Phase 1: API Integration**
```typescript
// ClickUp API configuration
const clickUpConfig = {
  apiToken: process.env.CLICKUP_API_TOKEN,
  teamId: process.env.CLICKUP_TEAM_ID,
};

// Fetch tasks
const getTasks = async (listId: string) => {
  const response = await fetch(
    `https://api.clickup.com/api/v2/list/${listId}/task`,
    {
      headers: { Authorization: clickUpConfig.apiToken }
    }
  );
  return response.json();
};
```

**Phase 2: Task Syncing**
```typescript
// Create timer from ClickUp task
const createTimerFromTask = (task: ClickUpTask) => {
  return {
    id: createId(),
    taskName: task.name,
    notes: task.description,
    clickUpTaskId: task.id,
    clickUpUrl: task.url,
  };
};

// Update ClickUp with tracked time
const updateTaskTime = async (taskId: string, milliseconds: number) => {
  await fetch(
    `https://api.clickup.com/api/v2/task/${taskId}/time`,
    {
      method: 'POST',
      body: JSON.stringify({
        duration: milliseconds,
        assignee: currentUser.clickUpId,
      })
    }
  );
};
```

#### User Experience
```
1. Connect ClickUp account
2. Select ClickUp lists/folders to sync
3. Tasks appear as timer templates
4. Click task to start timer
5. Time automatically synced to ClickUp
```

---

### Linear (Project Management)

**Status**: 📋 Planned  
**Priority**: Medium  
**Target**: Q2 2026

#### Goals
- Import Linear issues as timers
- Track time per issue
- Update issue status
- Link time tracking to cycles/projects

#### Implementation Plan

Similar to ClickUp integration but using Linear's GraphQL API:

```graphql
query GetMyIssues {
  issues(
    filter: { assignee: { id: { eq: $userId } } }
  ) {
    nodes {
      id
      title
      description
      project {
        id
        name
      }
    }
  }
}
```

---

### Google Calendar (Time Blocking)

**Status**: 💡 Idea  
**Priority**: Low  
**Target**: Future

#### Goals
- Create calendar events from time entries
- Visual timeline of work sessions
- Schedule timer reminders
- Integrate with meeting blocks

---

### Slack (Notifications)

**Status**: 💡 Idea  
**Priority**: Low  
**Target**: Future

#### Goals
- Notify team when timer starts
- Daily time summary messages
- Time goal reminders
- Integration with status updates

---

### GitHub (Development Tracking)

**Status**: 💡 Idea  
**Priority**: Low  
**Target**: Future

#### Goals
- Link timers to GitHub issues/PRs
- Track time per repository
- Correlate commits with time tracked
- Generate development reports

---

## Integration Architecture

### Proposed Backend Structure

```
Xano (or custom backend)
├── Users Table
│   ├── id
│   ├── email
│   └── integrations (JSON)
│       ├── zoho: { accessToken, refreshToken, expiresAt }
│       ├── clickup: { apiToken, teamId }
│       └── linear: { apiKey }
├── TimerGroups Table
│   ├── id
│   ├── user_id
│   ├── name
│   └── zoho_project_id (nullable)
├── Timers Table
│   ├── id
│   ├── group_id
│   ├── name
│   ├── clickup_task_id (nullable)
│   └── linear_issue_id (nullable)
└── TimeEvents Table
    ├── id
    ├── timer_id
    ├── start_time
    ├── end_time
    └── synced_to_zoho (boolean)
```

### Sync Strategy

**Option 1: Real-time Sync**
- Sync each event immediately when timer stops
- Pros: Always up-to-date
- Cons: More API calls, potential conflicts

**Option 2: Batch Sync**
- Sync all events at end of day
- Pros: Fewer API calls, can review before sync
- Cons: Delayed updates

**Recommended**: Hybrid approach
- Mark events for sync when timer stops
- Batch sync every 30 minutes
- Manual "Sync Now" button available

---

## OAuth Configuration

### Environment Variables Template

```env
# Xano (Current)
NEXT_PUBLIC_XANO_API_URL=https://your-workspace.xano.io/api:main
NEXT_PUBLIC_XANO_AUTH_TOKEN=your-token

# Zoho Books (Future)
ZOHO_CLIENT_ID=your-client-id
ZOHO_CLIENT_SECRET=your-client-secret
ZOHO_REDIRECT_URI=https://yourapp.com/oauth/zoho/callback

# ClickUp (Future)
CLICKUP_CLIENT_ID=your-client-id
CLICKUP_CLIENT_SECRET=your-client-secret

# Linear (Future)
LINEAR_CLIENT_ID=your-client-id
LINEAR_CLIENT_SECRET=your-client-secret
```

---

## Testing Integrations

### Xano Authentication

```bash
# Test login endpoint
curl -X POST https://your-workspace.xano.io/api:main/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Future Integration Tests

When implementing new integrations, test:
1. OAuth flow (authorize, token exchange, refresh)
2. API rate limiting handling
3. Error scenarios (network failure, invalid tokens)
4. Data synchronization (create, update, conflict resolution)

---

## Contributing

When adding a new integration:

1. Create integration module in `src/lib/integrations/`
2. Add configuration to environment variables
3. Update integration UI in settings page
4. Add tests for API calls
5. Document setup process
6. Update this guide

---

**Last Updated**: October 1, 2025
