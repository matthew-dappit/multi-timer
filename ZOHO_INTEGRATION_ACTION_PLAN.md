# Zoho Books Integration Action Plan

## Overview
This document outlines the plan to integrate the multi-timer application with Zoho Books API to enable time tracking that syncs with Zoho Books projects and tasks. This will require OAuth authentication, backend infrastructure (likely via Xano), and API integration.

---

## Phase 1: Research & Planning ✅

### 1.1 Zoho Books API Documentation Review ✅
- **Status**: Completed
- **Key Findings**:
  - Zoho Books uses OAuth 2.0 for authentication
  - Multiple data centers (.com, .eu, .in, .au, .jp, .ca, .cn, .sa)
  - API rate limits: 100 requests/minute, daily limits based on plan (1000-10000)
  - Concurrent rate limits: 5 (free) to 10 (paid) simultaneous API calls
  
### 1.2 Key API Endpoints Identified
- **Authentication**: 
  - `/oauth/v2/auth` - Authorization
  - `/oauth/v2/token` - Token generation/refresh
  - `/oauth/v2/token/revoke` - Token revocation
  
- **Organizations**: 
  - `GET /organizations` - Get organization_id (required for all API calls)
  
- **Projects**: 
  - `GET /projects` - List all projects
  - `GET /projects/{project_id}` - Get project details
  - Projects include tasks, users, billing info, and time tracking data
  
- **Time Entries** (Need to locate specific endpoint):
  - Typically under `/projects/{project_id}/timeentries`
  - Need to explore: Create, Read, Update, Delete time entries

### 1.3 OAuth Scopes Required
```
ZohoBooks.projects.READ
ZohoBooks.projects.CREATE
ZohoBooks.projects.UPDATE
ZohoBooks.settings.READ (for organization info)
```

---

## Phase 2: Backend Infrastructure Setup (Xano)

### 2.1 Xano Database Schema
Create the following tables in Xano:

#### **users** table
- `id` (int, primary key)
- `email` (text, unique)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### **zoho_auth** table
- `id` (int, primary key)
- `user_id` (int, foreign key → users.id)
- `access_token` (text, encrypted)
- `refresh_token` (text, encrypted)
- `token_expiry` (timestamp)
- `zoho_organization_id` (text)
- `zoho_data_center` (text) - (.com, .eu, .in, etc.)
- `api_domain` (text) - (https://www.zohoapis.com, etc.)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### **zoho_projects** table (cached project data)
- `id` (int, primary key)
- `user_id` (int, foreign key → users.id)
- `zoho_project_id` (text)
- `project_name` (text)
- `customer_name` (text)
- `status` (text)
- `billing_type` (text)
- `last_synced_at` (timestamp)
- `created_at` (timestamp)

#### **zoho_tasks** table (cached task data)
- `id` (int, primary key)
- `project_id` (int, foreign key → zoho_projects.id)
- `zoho_task_id` (text)
- `task_name` (text)
- `rate` (decimal)
- `is_billable` (boolean)
- `status` (text)
- `last_synced_at` (timestamp)

#### **timer_sessions** table (local timer data before sync)
- `id` (int, primary key)
- `user_id` (int, foreign key → users.id)
- `local_timer_id` (text) - Maps to MultiTimer component timer ID
- `zoho_project_id` (text, nullable)
- `zoho_task_id` (text, nullable)
- `task_name` (text)
- `notes` (text)
- `elapsed_seconds` (int)
- `started_at` (timestamp, nullable)
- `ended_at` (timestamp, nullable)
- `synced_to_zoho` (boolean, default: false)
- `zoho_time_entry_id` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 2.2 Xano API Endpoints to Create

#### Authentication Endpoints
1. **POST /auth/zoho/initiate**
   - Generates Zoho OAuth authorization URL
   - Input: `user_id`, `redirect_uri`
   - Output: `authorization_url`

2. **POST /auth/zoho/callback**
   - Handles OAuth callback with authorization code
   - Exchanges code for access & refresh tokens
   - Stores tokens in `zoho_auth` table
   - Input: `code`, `user_id`, `redirect_uri`
   - Output: `success`, `organization_id`, `api_domain`

3. **POST /auth/zoho/refresh**
   - Refreshes expired access token
   - Input: `user_id`
   - Output: `new_access_token`, `expires_at`

4. **DELETE /auth/zoho/disconnect**
   - Revokes tokens and removes authorization
   - Input: `user_id`
   - Output: `success`

#### Project & Task Endpoints
5. **GET /zoho/projects**
   - Fetches projects from Zoho Books
   - Caches in local database
   - Input: `user_id`, `force_refresh` (optional)
   - Output: Array of projects with tasks

6. **GET /zoho/projects/{project_id}/tasks**
   - Fetches tasks for a specific project
   - Input: `user_id`, `project_id`
   - Output: Array of tasks

#### Time Entry Endpoints
7. **POST /zoho/time-entries**
   - Creates a time entry in Zoho Books
   - Input: `user_id`, `project_id`, `task_id`, `elapsed_seconds`, `date`, `notes`
   - Output: `zoho_time_entry_id`, `success`

8. **PUT /zoho/time-entries/{entry_id}**
   - Updates an existing time entry
   - Input: `user_id`, `entry_id`, `elapsed_seconds`, `notes`
   - Output: `success`

9. **POST /timers/sync**
   - Syncs local timer data to Zoho Books
   - Batch syncs multiple timers
   - Input: `user_id`, `timer_sessions[]`
   - Output: `synced_count`, `failed_count`, `errors[]`

#### Utility Endpoints
10. **GET /zoho/auth-status**
    - Checks if user has valid Zoho authentication
    - Input: `user_id`
    - Output: `is_authenticated`, `organization_name`, `expires_at`

---

## Phase 3: Frontend Implementation (Next.js)

### 3.1 New Components to Create

#### `src/components/ZohoAuthButton.tsx`
- Button to initiate Zoho OAuth flow
- Shows connection status
- Handles disconnect functionality

#### `src/components/ZohoProjectSelector.tsx`
- Dropdown to select Zoho project
- Dropdown to select task within project
- Shows project billing type and rate
- Refresh button to fetch latest projects

#### `src/components/ZohoSyncStatus.tsx`
- Shows sync status for each timer
- Indicator: Synced ✅, Pending 🕒, Failed ❌
- Manual sync button
- Last synced timestamp

#### `src/components/ZohoSettings.tsx`
- Settings panel for Zoho integration
- Auto-sync toggle (sync on timer stop vs manual)
- Default project/task selection
- Connection info & disconnect option

### 3.2 Update Existing Components

#### `src/components/MultiTimer.tsx`
**Add new state:**
```typescript
interface TimerData {
  id: string;
  taskName: string;
  notes: string;
  elapsed: number;
  // NEW FIELDS:
  zohoProjectId?: string;
  zohoTaskId?: string;
  zohoSynced: boolean;
  zohoTimeEntryId?: string;
  lastSyncedAt?: number;
}
```

**Add functionality:**
- Project/Task selector for each timer
- Sync button per timer
- Batch sync all timers button
- Visual indicator of sync status
- Store Zoho-related data in localStorage

#### `src/components/Timer.tsx`
**Add:**
- Display selected Zoho project/task
- Sync status indicator
- Quick sync button

### 3.3 New API Routes (Next.js API Routes)

Create these in `src/app/api/`:

#### `src/app/api/zoho/auth/route.ts`
- Proxies requests to Xano auth endpoints
- Handles session management

#### `src/app/api/zoho/projects/route.ts`
- Fetches projects from Xano
- Caches in browser

#### `src/app/api/zoho/sync/route.ts`
- Sends timer data to Xano for syncing
- Handles errors and retries

### 3.4 State Management
Consider using Context API or Zustand for:
- Zoho authentication state
- Selected projects/tasks
- Sync status
- Available projects list

---

## Phase 4: Zoho Developer Console Setup

### 4.1 Register Application
1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Create new "Server-based Application"
3. Configure:
   - **Client Name**: "Multi-Timer App"
   - **Homepage URL**: Your production URL
   - **Authorized Redirect URLs**: 
     - `https://your-domain.com/api/zoho/callback`
     - `http://localhost:3000/api/zoho/callback` (for development)
4. Save Client ID and Client Secret
5. Enable Multi-DC support (if needed for international users)

### 4.2 Environment Variables
Store in `.env.local`:
```bash
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REDIRECT_URI=http://localhost:3000/api/zoho/callback
XANO_API_BASE_URL=https://your-xano-instance.com/api:1.0
XANO_API_KEY=your_xano_api_key
```

---

## Phase 5: Implementation Steps

### Step 1: Xano Backend Setup
- [ ] Create database schema
- [ ] Implement OAuth authentication endpoints
- [ ] Implement project fetching endpoints
- [ ] Implement time entry sync endpoints
- [ ] Add token refresh logic with automatic refresh before expiry
- [ ] Add error handling and logging
- [ ] Test with Postman/Insomnia

### Step 2: Zoho Developer Console
- [ ] Register application
- [ ] Configure redirect URIs
- [ ] Test OAuth flow manually
- [ ] Enable Multi-DC if needed

### Step 3: Frontend - Authentication
- [ ] Create `ZohoAuthButton` component
- [ ] Implement OAuth flow (initiate → callback → store tokens)
- [ ] Add auth status display
- [ ] Handle disconnect/reauthorize
- [ ] Test OAuth flow end-to-end

### Step 4: Frontend - Project Selection
- [ ] Create `ZohoProjectSelector` component
- [ ] Fetch and cache projects from Xano
- [ ] Integrate selector into `MultiTimer` component
- [ ] Add project/task info to timer display
- [ ] Store selections in state and localStorage

### Step 5: Frontend - Time Sync
- [ ] Add sync status indicators
- [ ] Implement manual sync button
- [ ] Implement auto-sync on timer stop (optional)
- [ ] Handle sync errors with user feedback
- [ ] Show last synced timestamp
- [ ] Add batch sync functionality

### Step 6: Testing
- [ ] Test OAuth flow with multiple data centers
- [ ] Test token refresh mechanism
- [ ] Test time entry creation/update in Zoho Books
- [ ] Test sync with multiple timers
- [ ] Test error scenarios (expired token, network failure, invalid project)
- [ ] Test with different Zoho Books plans (rate limits)

### Step 7: Polish & Documentation
- [ ] Add loading states
- [ ] Add success/error notifications
- [ ] Add user documentation
- [ ] Add error recovery mechanisms
- [ ] Optimize API calls (debouncing, batching)
- [ ] Add analytics/logging

---

## Phase 6: Advanced Features (Future)

### 6.1 Auto-sync Configuration
- Toggle between manual and automatic sync
- Sync on timer stop vs sync at intervals
- Sync only when connected to specific networks

### 6.2 Offline Support
- Queue time entries when offline
- Sync when connection restored
- Conflict resolution

### 6.3 Reporting
- View synced time entries
- Compare local vs Zoho data
- Export reports

### 6.4 Multi-Organization Support
- Support users with multiple Zoho Books organizations
- Organization switcher
- Separate project lists per organization

### 6.5 Bulk Operations
- Bulk sync all unsaved timers
- Bulk delete local timers after sync
- Archive old synced timers

---

## Technical Considerations

### Security
- Encrypt tokens in Xano database
- Use HTTPS for all API calls
- Implement CSRF protection for OAuth flow
- Never expose Client Secret in frontend code
- Implement rate limiting on Xano endpoints

### Performance
- Cache project/task lists (refresh every 24 hours or on-demand)
- Batch time entry syncs
- Optimize localStorage usage
- Lazy load Zoho-related components

### Error Handling
- Handle token expiration gracefully
- Retry failed syncs with exponential backoff
- Show user-friendly error messages
- Log errors for debugging

### Rate Limits
- Implement request throttling (max 100/minute)
- Queue requests when approaching limit
- Show warning when approaching daily limit
- Cache responses to minimize API calls

---

## API Endpoint Mapping

| Action | Zoho Books API | Xano Backend | Frontend |
|--------|----------------|--------------|----------|
| OAuth Initiate | `/oauth/v2/auth` | `POST /auth/zoho/initiate` | Button click |
| OAuth Callback | `/oauth/v2/token` | `POST /auth/zoho/callback` | Auto |
| Refresh Token | `/oauth/v2/token` | `POST /auth/zoho/refresh` | Auto |
| Get Organizations | `GET /organizations` | Called in callback | - |
| List Projects | `GET /projects` | `GET /zoho/projects` | Component mount |
| Create Time Entry | `POST /projects/{id}/timeentries` | `POST /zoho/time-entries` | Sync button |
| Update Time Entry | `PUT /projects/{id}/timeentries/{entry_id}` | `PUT /zoho/time-entries/{id}` | Re-sync |

---

## Testing Checklist

### OAuth Flow
- [ ] Authorization URL generation
- [ ] Token exchange
- [ ] Token storage
- [ ] Token refresh
- [ ] Token revocation
- [ ] Multi-DC support

### Project Management
- [ ] Fetch projects list
- [ ] Cache projects
- [ ] Display in dropdown
- [ ] Fetch tasks for project
- [ ] Handle empty states

### Time Tracking
- [ ] Create time entry
- [ ] Update time entry
- [ ] Sync multiple entries
- [ ] Handle failed syncs
- [ ] Display sync status

### Edge Cases
- [ ] Expired token during sync
- [ ] Network failure during sync
- [ ] Invalid project/task IDs
- [ ] Rate limit reached
- [ ] User deletes project in Zoho
- [ ] User revokes access in Zoho

---

## Next Steps

1. **Set up Firecrawl** (Already have documentation)
2. **Review Zoho Books time entry API** (Need to find specific endpoint)
3. **Create Xano workspace** and implement backend
4. **Register Zoho Developer application**
5. **Start with authentication flow** (highest priority)
6. **Iteratively build out features** following the phases above

---

## Resources

- [Zoho Books API Documentation](https://www.zoho.com/books/api/v3/)
- [Zoho OAuth Documentation](https://www.zoho.com/books/api/v3/oauth/)
- [Zoho Developer Console](https://api-console.zoho.com/)
- [Xano Documentation](https://docs.xano.com/)

---

## Questions to Resolve

1. ❓ What is the exact endpoint for creating time entries in Zoho Books?
   - Likely: `POST /projects/{project_id}/timeentries`
   - Need to find in documentation

2. ❓ Should users authenticate per organization or globally?
   - Recommendation: Start with single organization, add multi-org later

3. ❓ Auto-sync or manual sync as default?
   - Recommendation: Start with manual, add auto-sync as opt-in feature

4. ❓ Store all timer history or just recent timers?
   - Recommendation: Store last 30 days locally, keep synced data in Xano

5. ❓ Allow editing synced entries?
   - Recommendation: Yes, with update API call to Zoho

---

## Timeline Estimate

- **Phase 2 (Xano Backend)**: 8-12 hours
- **Phase 3 (Frontend Implementation)**: 12-16 hours
- **Phase 4 (Zoho Setup)**: 1-2 hours
- **Phase 5 (Integration & Testing)**: 8-12 hours
- **Phase 6 (Polish)**: 4-6 hours

**Total Estimated Time**: 33-48 hours

---

*Last Updated: September 30, 2025*
