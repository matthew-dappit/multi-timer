# Zoho OAuth Domain Switching Fix

## Problem

When authenticating with Zoho OAuth using OneAuth, the domain switches from `accounts.zoho.eu` to `accounts.zoho.com`, causing an "Invalid client ID" error because your OAuth app is registered in the EU region.

## Root Cause

Zoho's OneAuth system can redirect to different regional domains during authentication. Without explicitly specifying the data center, it may default to the US region (`.com`).

## Solution

Add the `dc` (data center) parameter to the authorization URL in your Xano backend.

### Xano Backend Fix

In your **Zoho OAuth API group** (api:Uw68A84W), modify the `/zoho/oauth/initiate` endpoint:

#### Current Authorization URL (Problematic)
```
https://accounts.zoho.eu/oauth/v2/auth?scope={scopes}&client_id={client_id}&response_type=code&access_type=offline&redirect_uri={redirect_uri}&state={state}
```

#### Fixed Authorization URL (Add dc parameter)
```
https://accounts.zoho.eu/oauth/v2/auth?scope={scopes}&client_id={client_id}&response_type=code&access_type=offline&redirect_uri={redirect_uri}&state={state}&dc=eu
```

**Note on Scopes**: Use correct Zoho Books scope format. For testing, start with:
```
ZohoBooks.fullaccess.ALL
```

For production, use specific scopes:
```
ZohoBooks.projects.ALL,ZohoBooks.timesheets.ALL
```

### Implementation Steps in Xano

1. **Open Xano workspace**: https://api.dappit.org
2. **Navigate to**: API Group `Uw68A84W` (Zoho OAuth)
3. **Edit endpoint**: `GET /zoho/oauth/initiate`
4. **Find the function stack** where you construct the authorization URL
5. **Locate the code** that builds the authorization URL string
6. **Add `&dc=eu`** to the end of the URL construction

Example (pseudo-code of what to look for in Xano):

```javascript
// BEFORE (Problematic)
var authorization_url = base_url + "?scope=" + scopes + 
  "&client_id=" + client_id + 
  "&response_type=code" +
  "&access_type=offline" +
  "&redirect_uri=" + redirect_uri +
  "&state=" + state;

// AFTER (Fixed)
var authorization_url = base_url + "?scope=" + scopes + 
  "&client_id=" + client_id + 
  "&response_type=code" +
  "&access_type=offline" +
  "&redirect_uri=" + redirect_uri +
  "&state=" + state +
  "&dc=eu";  // ADD THIS LINE
```

### Data Center Codes

If you need to support multiple regions in the future:

- **EU**: `dc=eu` → accounts.zoho.eu
- **US**: `dc=us` → accounts.zoho.com
- **India**: `dc=in` → accounts.zoho.in
- **Australia**: `dc=au` → accounts.zoho.com.au
- **China**: `dc=cn` → accounts.zoho.com.cn

## Testing After Fix

1. **Clear browser cookies** (important - Zoho may cache region preference)
2. **Restart your Next.js dev server**: 
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```
3. **Click "Connect to Zoho"** in the navbar
4. **Verify the URL** includes `&dc=eu` when redirected to Zoho
5. **Sign in with OneAuth**
6. **Confirm redirect stays on `.eu` domain**
7. **Verify successful OAuth callback** and token exchange

## Expected URLs After Fix

### Initial authorization URL
```
https://accounts.zoho.eu/oauth/v2/auth?scope=...&client_id=...&dc=eu
```

### After authentication (should stay on .eu)
```
https://accounts.zoho.eu/oauth/v2/auth?scope=...&client_id=...&dc=eu
```

### Callback to your app
```
http://localhost:3000/integrations/zoho/callback?code=1000.xxx&state=1&location=eu&accounts-server=https://accounts.zoho.eu
```

## Additional Notes

### Why OneAuth Causes This Issue

OneAuth is Zoho's unified authentication system that works across all Zoho regions. When you scan the QR code with your phone:

1. Your phone authenticates with Zoho's global OneAuth system
2. Without the `dc` parameter, OneAuth may redirect to the default US region
3. The US region doesn't recognize your EU client ID → error

The `dc` parameter tells OneAuth: "After authentication, redirect back to the EU region specifically."

### Frontend Code (No Changes Needed)

Your frontend code in `src/lib/zoho-oauth.ts` and `src/app/integrations/zoho/callback/page.tsx` is already correct and doesn't need any changes. The fix is entirely backend-side.

### Verifying the Fix Works

After implementing the fix, check the browser's developer tools:

1. **Network tab**: Look at the initial redirect to Zoho
2. **Verify the URL** contains `&dc=eu`
3. **Watch the domain** during authentication - it should stay on `.eu`

## Reference

- [Zoho OAuth Documentation](https://www.zoho.com/accounts/protocol/oauth/multi-dc.html)
- [Zoho Data Centers](https://help.zoho.com/portal/en/kb/accounts/account-settings/articles/zoho-data-centers)
