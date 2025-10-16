# Zoho OAuth Frontend Implementation

## Overview

This document describes the frontend implementation of Zoho OAuth integration for the Multi-Timer application.

## Files Created/Modified

### 1. Created: `src/lib/zoho-oauth.ts`

**Purpose:** API client library for Zoho OAuth endpoints

**Key Functions:**
- `zohoOAuthAPI.initiate()` - Get authorization URL from backend (requires auth)
- `zohoOAuthAPI.callback(data)` - Exchange code for tokens (no auth required)
- `zohoOAuthAPI.getStatus()` - Check OAuth connection status (requires auth)
- `zohoOAuthAPI.disconnect()` - Remove OAuth connection (requires auth)
- `zohoOAuthAPI.startOAuthFlow()` - Convenience method to initiate and redirect

**Configuration:**
- Uses `NEXT_PUBLIC_ZOHO_OAUTH_API_BASE_URL` from `.env.local`
- Retrieves auth token from localStorage (same as main auth)

### 2. Created: `src/app/integrations/zoho/callback/page.tsx`

**Purpose:** OAuth callback handler page

**Flow:**
1. Extracts URL parameters: `code`, `state`, `location`, `accounts-server`
2. Calls `zohoOAuthAPI.callback()` with the parameters
3. Shows loading/success/error states
4. Redirects to home page on success after 2 seconds

**URL Format:**
```
http://localhost:3000/integrations/zoho/callback?code=1000.abc...&state=123&location=eu&accounts-server=https://accounts.zoho.eu
```

### 3. Modified: `src/components/Navbar.tsx`

**Changes:**
- Updated design to match provided CSS specifications:
  - White background with custom shadow
  - Horizontal layout with logo on left
  - User info (name + email) on right with Poppins font
  - Logout icon button (SVG)
  - Fixed height of 89px
  - Padding: 8px 48px (responsive)
- Added "Connect to Zoho" button in center navigation
- Added `handleConnectZoho()` function to trigger OAuth flow
- Removed dark mode styles (light background only per design)

### 4. Modified: `src/lib/auth.ts`

**Changes:**
- Updated to use `NEXT_PUBLIC_AUTH_API_BASE_URL` instead of `NEXT_PUBLIC_API_BASE_URL`
- This aligns with the environment variable naming in `.env.local`

## Environment Variables

The `.env.local` file contains:

```env
# Main application API (authentication, user management)
NEXT_PUBLIC_AUTH_API_BASE_URL=https://api.dappit.org/api:vsVOMFSf

# Zoho OAuth API (separate group for Zoho integration)
NEXT_PUBLIC_ZOHO_OAUTH_API_BASE_URL=https://api.dappit.org/api:Uw68A84W
```

## OAuth Flow

### User Journey

1. **User clicks "Connect to Zoho" button** in navbar
   - Calls `handleConnectZoho()` in Navbar component
   - Triggers `zohoOAuthAPI.startOAuthFlow()`

2. **Backend generates authorization URL**
   - Frontend calls `GET /zoho/oauth/initiate` with JWT token
   - Backend returns Zoho authorization URL with:
     - Client ID
     - Scopes (ZohoBooks.projects.READ, etc.)
     - Redirect URI (localhost:3000 or production URL)
     - State parameter (user ID)

3. **User redirects to Zoho**
   - Browser navigates to Zoho authorization page
   - User logs in and authorizes the app

4. **Zoho redirects back to callback page**
   - URL: `/integrations/zoho/callback?code=...&state=...&location=...&accounts-server=...`
   - Callback page extracts parameters

5. **Frontend exchanges code for tokens**
   - Calls `POST /zoho/oauth/callback` with code and state
   - Backend exchanges code for access/refresh tokens
   - Backend stores tokens in database

6. **Success confirmation**
   - Shows success message
   - Redirects to home page after 2 seconds

### Error Handling

- Network errors: Caught and displayed with alert
- Invalid parameters: Backend returns 400 error
- Authentication errors: Backend returns 401 error
- All errors are logged to console

## API Endpoints Used

### 1. GET /zoho/oauth/initiate

**Authentication:** Required (JWT Bearer token)

**Response:**
```json
{
  "authorization_url": "https://accounts.zoho.eu/oauth/v2/auth?..."
}
```

### 2. POST /zoho/oauth/callback

**Authentication:** Not required (validated via state parameter)

**Request Body:**
```json
{
  "code": "1000.abc123...",
  "state": "123",
  "location": "eu",
  "accounts_server": "https://accounts.zoho.eu"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Zoho connected successfully",
  "expires_in": 3600
}
```

## Testing Instructions

### Prerequisites
1. Ensure backend endpoints are deployed and working
2. Ensure Zoho OAuth app is configured with correct redirect URIs:
   - Development: `http://localhost:3000/integrations/zoho/callback`
   - Production: `https://multi-timer-one.vercel.app/integrations/zoho/callback`

### Test Steps

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Login to the application**
   - Navigate to `http://localhost:3000`
   - Login with your credentials

3. **Click "Connect to Zoho" button**
   - Button is in the center of the navbar
   - Should redirect to Zoho authorization page

4. **Authorize on Zoho**
   - Login to Zoho if not already logged in
   - Click "Accept" to authorize the app

5. **Verify callback**
   - Should redirect to `/integrations/zoho/callback`
   - Should show "Success!" message
   - Should redirect to home page after 2 seconds

6. **Check for errors**
   - Open browser console (F12)
   - Look for any error messages
   - Verify no network errors in Network tab

### Expected Results

✅ OAuth flow completes successfully
✅ Tokens are stored in database (verify in Xano)
✅ No console errors
✅ User is redirected back to home page
✅ "Connect to Zoho" button still visible (for now)

## Next Steps

After OAuth is working:

1. **Add OAuth status check**
   - Call `zohoOAuthAPI.getStatus()` on navbar mount
   - Show "Connected" badge or change button text
   - Hide "Connect to Zoho" button if already connected

2. **Add disconnect functionality**
   - Add "Disconnect Zoho" button when connected
   - Call `zohoOAuthAPI.disconnect()`

3. **Implement Zoho Books integration**
   - Create endpoints to fetch projects
   - Create endpoints to submit time entries
   - Add UI for project selection and time entry sync

4. **Add automatic token refresh**
   - Implement token refresh logic in API calls
   - Handle expired tokens gracefully

## Troubleshooting

### "Failed to start OAuth flow" error
- Check that `NEXT_PUBLIC_ZOHO_OAUTH_API_BASE_URL` is set correctly
- Verify JWT token is valid (check localStorage)
- Check browser console for detailed error

### Callback page shows error
- Verify redirect URI matches exactly in Zoho OAuth app settings
- Check that backend `/zoho/oauth/callback` endpoint is working
- Verify `code` and `state` parameters are present in URL

### Redirect URI mismatch error
- Ensure backend is using the same redirect URI as configured in Zoho
- Check that environment detection logic is working (localhost vs production)

## Design Specifications

### Navbar Design

Based on provided CSS:

- **Container:**
  - Display: flex, flex-direction: row
  - Justify-content: space-between
  - Align-items: center
  - Padding: 8px 48px (responsive: 8px 24px on mobile)
  - Height: 89px
  - Background: #FFFFFF
  - Box-shadow: 0px 9px 90px 25px rgba(0, 0, 0, 0.02)

- **Logo:**
  - Width: 112px
  - Height: 52px
  - "MULTI-TIMER" text below logo
  - Font: Poppins, 12.86px, font-weight: 300
  - Letter-spacing: 0.54px

- **User Info:**
  - Font: Poppins
  - Name: 16px, font-weight: 400, color: #000000
  - Email: 16px, font-weight: 300, color: #717182
  - Text-align: right

- **Logout Icon:**
  - Width: 32px, Height: 32px
  - Material Icons: ic:baseline-logout
  - Color: #000000

## Security Considerations

1. **State Parameter:** Used to prevent CSRF attacks
   - Backend generates state (user ID)
   - Frontend passes it through OAuth flow
   - Backend validates on callback

2. **Token Storage:** Tokens stored server-side only
   - Access token and refresh token never exposed to frontend
   - Frontend only receives success/failure response

3. **Authentication:** Initiate endpoint requires JWT
   - Ensures only authenticated users can start OAuth flow
   - User ID extracted from JWT token

4. **HTTPS:** Production must use HTTPS
   - OAuth redirect URIs must use HTTPS in production
   - Tokens transmitted securely

