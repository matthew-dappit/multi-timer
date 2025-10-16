# Zoho Books Scopes - Quick Reference

## ✅ Correct Scopes for Multi-Timer

Based on the Zoho Books API v3 documentation (`time-entries.yml`):

### Recommended Configuration

```
ZohoBooks.projects.READ,ZohoBooks.projects.CREATE,ZohoBooks.projects.UPDATE
```

## What Each Scope Does

| Scope | API Operations Enabled | Multi-Timer Features |
|-------|----------------------|---------------------|
| `ZohoBooks.projects.READ` | • List time entries<br>• Get time entry details<br>• View projects<br>• Get running timer | • View time history<br>• Display projects<br>• Show current timer status |
| `ZohoBooks.projects.CREATE` | • Log time entries<br>• Start timer<br>• Stop timer | • Create time entries from timer<br>• Manual time entry<br>• Timer functionality |
| `ZohoBooks.projects.UPDATE` | • Edit time entries<br>• Modify logged time | • Edit existing time entries<br>• Correct mistakes |
| `ZohoBooks.projects.DELETE` | • Delete time entries | • Remove incorrect entries<br>• *(Optional - not included by default)* |

## API Endpoints Reference

From Zoho Books API documentation:

| Endpoint | Method | Scope Required | Purpose |
|----------|--------|---------------|---------|
| `/projects/timeentries` | GET | `projects.READ` | List time entries |
| `/projects/timeentries` | POST | `projects.CREATE` | Log time entry |
| `/projects/timeentries/{id}` | GET | `projects.READ` | Get time entry details |
| `/projects/timeentries/{id}` | PUT | `projects.UPDATE` | Update time entry |
| `/projects/timeentries/{id}` | DELETE | `projects.DELETE` | Delete time entry |
| `/projects/timeentries/{id}/timer/start` | POST | `projects.CREATE` | Start timer |
| `/projects/timeentries/timer/stop` | POST | `projects.CREATE` | Stop timer |
| `/projects/timeentries/runningtimer/me` | GET | `projects.READ` | Get running timer |

## Important Notes

### ⚠️ No Separate "Timesheets" Scope

Zoho Books v3 API does **NOT** have a separate `timesheets` scope. Time entries are managed under the `projects` module:

- ❌ `ZohoBooks.timesheets.READ` - Does not exist
- ❌ `ZohoBooks.timesheets.CREATE` - Does not exist
- ✅ `ZohoBooks.projects.READ` - Correct
- ✅ `ZohoBooks.projects.CREATE` - Correct

### API Endpoint Structure

All time entry operations use the `/projects/timeentries` path, confirming they belong to the `projects` scope.

## Alternative Scope Configurations

### Option 1: Specific Permissions (Recommended)
```
ZohoBooks.projects.READ,ZohoBooks.projects.CREATE,ZohoBooks.projects.UPDATE
```
- ✅ Most secure
- ✅ Clear permissions
- ✅ Sufficient for Multi-Timer features

### Option 2: All Project Operations
```
ZohoBooks.projects.ALL
```
- ✅ Simpler to manage
- ✅ Includes DELETE (if needed later)
- ⚠️ More permissive than necessary

### Option 3: Full Access (Development Only)
```
ZohoBooks.fullaccess.ALL
```
- ✅ Quick testing
- ❌ Too permissive for production
- ❌ Access to all Zoho Books modules

## What to Update in Xano

In your `/zoho/oauth/initiate` endpoint, change the scope parameter to:

```javascript
'scope=ZohoBooks.projects.READ,ZohoBooks.projects.CREATE,ZohoBooks.projects.UPDATE'
```

Don't forget to also add:

```javascript
'&dc=eu'
```

To prevent domain switching during OAuth.

## Complete Authorization URL

```
https://accounts.zoho.eu/oauth/v2/auth?
  scope=ZohoBooks.projects.READ%2CZohoBooks.projects.CREATE%2CZohoBooks.projects.UPDATE
  &client_id=1000.YOUR_CLIENT_ID
  &response_type=code
  &access_type=offline
  &redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fintegrations%2Fzoho%2Fcallback
  &state=USER_ID
  &dc=eu
```

## Testing Checklist

After updating scopes:

1. ✅ Clear browser cookies
2. ✅ Restart dev server
3. ✅ Click "Connect to Zoho"
4. ✅ Verify consent screen shows correct permissions
5. ✅ Complete authorization
6. ✅ Test time entry creation
7. ✅ Test time entry viewing
8. ✅ Test time entry editing

## Reference

- **API Documentation**: `docs/time-entries.yml`
- **Full Guide**: `docs/ZOHO_SCOPES_REFERENCE.md`
- **Integration Guide**: `docs/zoho-integration.md`
- **Domain Fix**: `docs/ZOHO_DOMAIN_FIX.md`
