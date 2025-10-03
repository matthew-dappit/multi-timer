# Zoho Books OAuth Scopes Reference

## Quick Fix

If you're getting "Invalid OAuth Scope" error, update your scopes in Xano to:

**For Multi-Timer App (Recommended):**
```
ZohoBooks.projects.READ,ZohoBooks.projects.CREATE,ZohoBooks.projects.UPDATE
```

**For Testing (Full Access):**
```
ZohoBooks.fullaccess.ALL
```

**Alternative (All Project Operations):**
```
ZohoBooks.projects.ALL
```

## Scope Format

Zoho OAuth scopes follow this pattern:

```
ServiceName.scope_name.OPERATION_TYPE
```

### Parts Explained

1. **ServiceName**: The Zoho product (e.g., `ZohoBooks`, `ZohoCRM`, `ZohoInvoice`)
2. **scope_name**: The module within the service (e.g., `projects`, `timesheets`, `invoices`)
3. **OPERATION_TYPE**: The permission level - must be UPPERCASE:
   - `ALL` - Full access (create, read, update, delete)
   - `READ` - Read-only access
   - `CREATE` - Create new records
   - `UPDATE` - Modify existing records
   - `DELETE` - Remove records

### Multiple Scopes

Separate multiple scopes with commas (no spaces):

```
ZohoBooks.projects.ALL,ZohoBooks.timesheets.ALL,ZohoBooks.invoices.READ
```

## Zoho Books Scopes for Multi-Timer

### Recommended Scopes (Based on API Documentation)

For time tracking with projects in Zoho Books:

```
ZohoBooks.projects.READ,ZohoBooks.projects.CREATE,ZohoBooks.projects.UPDATE
```

**What these scopes enable:**
- ✅ **READ**: List projects, view time entries, get project details
- ✅ **CREATE**: Log time entries (create new time records)
- ✅ **UPDATE**: Edit existing time entries

**API Endpoints Covered:**
- `GET /projects/timeentries` - List time entries (requires `READ`)
- `POST /projects/timeentries` - Log time entries (requires `CREATE`)
- `GET /projects/timeentries/{id}` - Get time entry details (requires `READ`)
- `PUT /projects/timeentries/{id}` - Update time entry (requires `UPDATE`)
- `GET /projects/timeentries/runningtimer/me` - Get running timer (requires `READ`)
- `POST /projects/timeentries/{id}/timer/start` - Start timer (requires `CREATE`)
- `POST /projects/timeentries/timer/stop` - Stop timer (requires `CREATE`)

### Optional: Add Delete Permission

If you also want users to delete time entries:

```
ZohoBooks.projects.READ,ZohoBooks.projects.CREATE,ZohoBooks.projects.UPDATE,ZohoBooks.projects.DELETE
```

Or simply use:

```
ZohoBooks.projects.ALL
```

(which includes READ, CREATE, UPDATE, and DELETE)

### Specific Operation Scopes

Based on Zoho Books API documentation, time entries are managed under the `projects` scope (not `timesheets`):

```
ZohoBooks.projects.READ,ZohoBooks.projects.CREATE,ZohoBooks.projects.UPDATE
```

**Why `projects` and not `timesheets`?**
- Zoho Books uses `projects.READ/CREATE/UPDATE/DELETE` for time entry operations
- The API endpoint is `/projects/timeentries` (part of projects module)
- `timesheets` scope doesn't exist in Zoho Books v3 API

### Full Access (Development/Testing)

For testing or if you need broader access:

```
ZohoBooks.fullaccess.ALL
```

⚠️ **Warning**: This gives complete access to all Zoho Books data. Only use for testing or if you need comprehensive access.

## Common Zoho Books Scopes

| Module | Scope | Purpose |
|--------|-------|---------|
| Projects (Time Entries) | `ZohoBooks.projects.READ` | View projects and time entries |
| Projects (Time Entries) | `ZohoBooks.projects.CREATE` | Log new time entries, start/stop timer |
| Projects (Time Entries) | `ZohoBooks.projects.UPDATE` | Edit existing time entries |
| Projects (Time Entries) | `ZohoBooks.projects.DELETE` | Delete time entries |
| Projects (All Operations) | `ZohoBooks.projects.ALL` | Full project/time entry management |
| Invoices | `ZohoBooks.invoices.ALL` | Create/manage invoices |
| Customers | `ZohoBooks.customers.READ` | Read customer information |
| Settings | `ZohoBooks.settings.READ` | Read account settings |
| Full Access | `ZohoBooks.fullaccess.ALL` | Complete access to all modules |

**Note:** Time entries in Zoho Books are managed under the `projects` scope, not a separate `timesheets` scope.

## Troubleshooting Scope Errors

### Error: "Invalid OAuth Scope"

**Possible causes:**

1. **Incorrect case**: Operations must be UPPERCASE (`ALL`, not `all`)
2. **Typo in module name**: Check Zoho Books API docs for exact names
3. **Extra spaces**: Remove all spaces from scope string
4. **Invalid module**: The module doesn't exist in Zoho Books

**Solution:**
- Start with `ZohoBooks.fullaccess.ALL` to verify OAuth works
- Then narrow down to specific scopes

### Error: "Scope does not exist"

This usually means:
- The module name is incorrect (e.g., `timesheet` vs `timesheets`)
- The service name is wrong (e.g., `ZohoBook` vs `ZohoBooks`)
- The scope is not available for your Zoho plan

**Solution:**
- Verify exact scope names in [Zoho Books API Documentation](https://www.zoho.com/books/api/v3/)
- Check your Zoho Books plan supports the feature

## Where to Update Scopes

### In Xano Backend

1. **Open**: https://api.dappit.org
2. **Navigate to**: API Group `Uw68A84W` (Zoho OAuth)
3. **Edit**: `GET /zoho/oauth/initiate` endpoint
4. **Find**: Scope variable/input (likely named `scopes` or `scope`)
5. **Update**: Change to desired scope string
6. **Save**: Deploy changes

### Testing the New Scopes

After updating:

1. **Clear browser cookies** (important!)
2. **Restart Next.js dev server**:
   ```bash
   npm run dev
   ```
3. **Click "Connect to Zoho"** again
4. **Check the consent screen** - it should show the new scopes
5. **Authorize** and verify successful connection

## Recommended Scope Strategy

### Phase 1: Development (Current)
```
ZohoBooks.fullaccess.ALL
```
- Quick setup
- Easy debugging
- No scope-related errors

### Phase 2: MVP Launch (Recommended)
```
ZohoBooks.projects.READ,ZohoBooks.projects.CREATE,ZohoBooks.projects.UPDATE
```
- Specific permissions for each operation
- Read projects and time entries
- Create new time entries
- Edit existing time entries
- Follows principle of least privilege

### Phase 3: Production with Delete (If Needed)
```
ZohoBooks.projects.ALL
```
- Includes READ, CREATE, UPDATE, and DELETE
- Simplest to maintain
- Still scoped to projects only (not full account access)

## Reference Links

- [Zoho OAuth Scopes Documentation](https://www.zoho.com/accounts/protocol/oauth/scopes.html)
- [Zoho Books API v3 Documentation](https://www.zoho.com/books/api/v3/)
- [Zoho Books API Scopes List](https://www.zoho.com/books/api/v3/oauth/#scopes)

## Example: Full Authorization URL

With correct scopes, your authorization URL should look like:

```
https://accounts.zoho.eu/oauth/v2/auth?
  scope=ZohoBooks.projects.READ,ZohoBooks.projects.CREATE,ZohoBooks.projects.UPDATE
  &client_id=1000.XXXXXXXXXXXXX
  &response_type=code
  &access_type=offline
  &redirect_uri=http://localhost:3000/integrations/zoho/callback
  &state=123
  &dc=eu
```

Note: URL parameters are URL-encoded in practice, so commas become `%2C`.
