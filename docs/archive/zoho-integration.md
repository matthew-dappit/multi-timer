# Zoho OAuth Integration - Implementation Guide

## Database Tables

### Dappit Users

**Table Name:** `dappit_users`  
**Description:** Users from the Dappit organization for Dappit internal projects

#### Schema

| Column       | Type      | Description                        |
|--------------|-----------|------------------------------------|
| `id`         | integer   | Sequential unique user identifier  |
| `created_at` | timestamp | Account creation date/time         |
| `email`      | email     | User email address                 |
| `password`   | password  | Hashed password                    |
| `first_name` | text      | User's first name                  |
| `last_name`  | text      | User's last name                   |

---

### Zoho OAuth

**Table Name:** `zoho_oauth`  
**Description:** Stores OAuth tokens for Zoho integration

#### Schema

| Column            | Type      | Description                                 |
|-------------------|-----------|---------------------------------------------|
| `id`              | integer   | Unique identifier for the OAuth record      |
| `dappit_user_id`  | integer   | References the associated Dappit user       |
| `access_token`    | text      | Zoho OAuth access token                     |
| `refresh_token`   | text      | Zoho OAuth refresh token                    |
| `token_expires_at`| timestamp | Access token expiration date/time           |
| `accounts_server` | text      | Zoho accounts server URL (e.g., "https://accounts.zoho.eu") |
| `scope`           | text      | OAuth scopes granted (e.g., "ZohoBooks.projects.READ,...") |
| `created_at`      | timestamp | Record creation date/time                   |
| `updated_at`      | timestamp | Last update date/time                       |

#### Indexes

- **Unique index** on `dappit_user_id` to ensure one OAuth record per user

---

## Xano API Group Structure

**API Group Name in Xano:** `Zoho OAuth` (visual organization)  
**API Group Base URL:** `https://api.dappit.org/api:[YOUR_ZOHO_GROUP_ID]`

> **Note:** Each API group in Xano gets its own unique base URL. This separates concerns and keeps your authentication logic isolated from your main application logic. This is a best practice for security and maintainability.

**Endpoints to create within the "Zoho OAuth" group:**

| Endpoint Path in Xano | Method | Full URL |
|----------------------|--------|----------|
| `/zoho/oauth/initiate` | GET | `https://api.dappit.org/api:[ZOHO_GROUP_ID]/zoho/oauth/initiate` |
| `/zoho/oauth/callback` | POST | `https://api.dappit.org/api:[ZOHO_GROUP_ID]/zoho/oauth/callback` |
| `/zoho/oauth/refresh` | POST | `https://api.dappit.org/api:[ZOHO_GROUP_ID]/zoho/oauth/refresh` |
| `/zoho/oauth/status` | GET | `https://api.dappit.org/api:[ZOHO_GROUP_ID]/zoho/oauth/status` |
| `/zoho/oauth/disconnect` | DELETE | `https://api.dappit.org/api:[ZOHO_GROUP_ID]/zoho/oauth/disconnect` |

### Frontend Configuration

Add to `.env.local`:
```env
# Main application API (authentication, user management)
NEXT_PUBLIC_API_BASE_URL=https://api.dappit.org/api:vsVOMFSf

# Zoho OAuth API (separate group for Zoho integration)
NEXT_PUBLIC_ZOHO_API_BASE_URL=https://api.dappit.org/api:[YOUR_ZOHO_GROUP_ID]
```

Then in your frontend code:
```typescript
// Call Zoho OAuth endpoints using the Zoho-specific base URL
const response = await fetch(`${process.env.NEXT_PUBLIC_ZOHO_API_BASE_URL}/zoho/oauth/initiate`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## API Endpoints - OAuth Flow Only

### 1. Initiate OAuth Connection

**Xano Endpoint Path:** `/zoho/oauth/initiate`  
**Method:** GET  
**Authentication:** Required (JWT)  
**Purpose:** Generate Zoho authorization URL and redirect user to Zoho login

#### Request

**Headers:**
```
Authorization: Bearer {jwt_token}    # Text (JWT string)
```

**Query Parameters:**
None

#### Logic Flow

```javascript
// 1. Get authenticated user ID from JWT token
const userId = authToken.user_id;

// 2. Determine redirect URI based on request origin
const referer = $env.$http_headers.Referer || $env.$http_headers.Origin;
let redirectUri;

if (referer && referer.includes('localhost')) {
  // Development environment
  redirectUri = 'http://localhost:3000/integrations/zoho/callback';
} else {
  // Production environment
  redirectUri = 'https://multi-timer-one.vercel.app/integrations/zoho/callback';
}

// 3. Build Zoho authorization URL (EU data center)
// Scopes explained:
// - ZohoBooks.projects.READ: List projects and view time entries
// - ZohoBooks.projects.CREATE: Log time entries (create time entries)
// - ZohoBooks.projects.UPDATE: Edit time entries
// - ZohoBooks.projects.DELETE: Delete time entries (optional)
const authUrl = 'https://accounts.zoho.eu/oauth/v2/auth?' + 
  'scope=ZohoBooks.projects.READ,ZohoBooks.projects.CREATE,ZohoBooks.projects.UPDATE' +
  '&client_id=' + $env.MULTI_TIMER_ZOHO_CLIENT_ID +
  '&response_type=code' +
  '&access_type=offline' +
  '&redirect_uri=' + encodeURIComponent(redirectUri) +
  '&state=' + $auth.id + // Pass user ID to track on callback
  '&dc=eu'; // Force EU data center to prevent domain switching during OneAuth

// 4. Return authorization URL
return {
  authorization_url: authUrl
};
```

#### Response

**Success (200):**
```json
{
  "authorization_url": "https://accounts.zoho.eu/oauth/v2/auth?scope=ZohoBooks.projects.READ,ZohoBooks.projects.CREATE,ZohoBooks.projects.UPDATE&client_id=1000.ABC123...&response_type=code&access_type=offline&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fintegrations%2Fzoho%2Fcallback&state=123&dc=eu"
}
```

**Frontend Action:**
```javascript
// Redirect user to authorization_url
window.location.href = response.authorization_url;
```

---

### 2. OAuth Callback Handler

**Xano Endpoint Path:** `/zoho/oauth/callback`  
**Method:** POST  
**Authentication:** Not required (public endpoint, validated via state parameter)  
**Purpose:** Exchange Zoho grant token for access/refresh tokens and store in database

#### Request

**Body (application/json):**
```json
{
  "code": "1000.bf5a54******************b20aab8ec260557362",
  "state": "123",
  "location": "us",
  "accounts_server": "https://accounts.zoho.com"
}
```

**Parameters:**
- `code` (Text, required): Grant token from Zoho OAuth redirect
- `state` (Text, required): User ID passed during initiation (opaque string; parse to integer server-side if needed)
- `location` (Text, optional): Zoho data center location (e.g., "us", "eu", "in", "au")
- `accounts_server` (Text, optional): Zoho accounts server URL (e.g., "https://accounts.zoho.com")

#### Logic Flow

```javascript
// 1. Validate state parameter
const userId = input.state;
if (!userId || isNaN(userId)) {
  throw new Error('Invalid state parameter');
}

// 2. Verify user exists
const user = await dappit_users.findOne({ id: userId });
if (!user) {
  throw new Error('User not found');
}

// 3. Exchange grant token for access/refresh tokens (EU data center)
// Determine redirect URI using same logic as initiate (must match exactly)
const referer = $env.$http_headers.Referer || $env.$http_headers.Origin;
let redirectUri;
if (referer && referer.includes('localhost')) {
  redirectUri = 'http://localhost:3000/integrations/zoho/callback';
} else {
  redirectUri = 'https://multi-timer-one.vercel.app/integrations/zoho/callback';
}

const tokenResponse = await fetch('https://accounts.zoho.eu/oauth/v2/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: $env.MULTI_TIMER_ZOHO_CLIENT_ID,
    client_secret: $env.MULTI_TIMER_ZOHO_CLIENT_SECRET,
    redirect_uri: redirectUri,
    code: input.code
  })
});

const tokens = await tokenResponse.json();

// 4. Check for errors from Zoho
if (tokens.error) {
  throw new Error('Zoho OAuth error: ' + tokens.error);
}

// 5. Calculate token expiration time
// Zoho tokens expire in 3600 seconds (1 hour)
const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

// 6. Store or update tokens in database
// Also store accounts_server and scope for multi-region support and auditing
const existingOAuth = await zoho_oauth.findOne({ dappit_user_id: userId });

if (existingOAuth) {
  // Update existing record
  await zoho_oauth.update({
    id: existingOAuth.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: expiresAt,
    accounts_server: input.accounts_server || 'https://accounts.zoho.eu',
    scope: tokens.scope,
    updated_at: new Date()
  });
} else {
  // Create new record
  await zoho_oauth.create({
    dappit_user_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: expiresAt,
    accounts_server: input.accounts_server || 'https://accounts.zoho.eu',
    scope: tokens.scope,
    created_at: new Date(),
    updated_at: new Date()
  });
}

// 7. Return success
return {
  success: true,
  message: 'Zoho connected successfully',
  expires_in: tokens.expires_in
};
```

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Zoho connected successfully",
  "expires_in": 3600
}
```

**Error Responses:**

**Invalid grant token (400):**
```json
{
  "error": "invalid_code",
  "message": "Grant token has expired or is invalid"
}
```

**Invalid client credentials (401):**
```json
{
  "error": "invalid_client",
  "message": "Client ID or secret is incorrect"
}
```

**User not found (404):**
```json
{
  "error": "user_not_found",
  "message": "User not found"
}
```

---

### 3. Refresh Access Token (Internal Function)

**Xano Function:** `oauth/token_refresh`  
**Type:** Internal function (not a direct API endpoint)  
**Purpose:** Refresh expired access token using refresh token  
**Triggered by:** 
- Scheduled task `zoho/oauth/refresh_api_tokens` (runs every 15 minutes)
- Can be called manually by other endpoints when token is expired

#### Function Input

```javascript
{
  zoho_oauth_id: integer // ID of the zoho_oauth record to refresh
}
```

#### Logic Flow

```javascript
// 1. Get OAuth record from database
const oauthRecord = await db.get('zoho_oauth', {
  field_name: 'id',
  field_value: input.zoho_oauth_id
});

// 2. Request new access token from Zoho using stored accounts_server
// This supports multi-region (EU, US, IN, AU, etc.)
const tokenResponse = await api.request({
  url: oauthRecord.accounts_server + '/oauth/v2/token',
  method: 'POST',
  headers: ['Content-Type: application/x-www-form-urlencoded'],
  params: {
    refresh_token: oauthRecord.refresh_token,
    client_id: $env.MULTI_TIMER_ZOHO_CLIENT_ID,
    client_secret: $env.MULTI_TIMER_ZOHO_SECRET,
    grant_type: 'refresh_token'
  }
});

// 3. Update access token in database
await db.edit('zoho_oauth', {
  field_name: 'id',
  field_value: input.zoho_oauth_id,
  data: {
    access_token: tokenResponse.response.result.access_token,
    token_expires_at: now() + tokenResponse.response.result.expires_in + ' seconds',
    scope: tokenResponse.response.result.scope
  }
});

// 4. Return result
return { result: 'success' };
```

#### Scheduled Task: Auto-Refresh Tokens

**Task Name:** `zoho/oauth/refresh_api_tokens`  
**Schedule:** Runs periodically (configure interval as needed)  
**Purpose:** Automatically refresh tokens before they expire

```javascript
// Find all tokens expiring in the next 15 minutes
const expiringTokens = await db.query('zoho_oauth', {
  where: 'token_expires_at <= now() + 15 minutes'
});

// Refresh each expiring token
for (const token of expiringTokens) {
  await function.run('oauth/token_refresh', {
    zoho_oauth_id: token.id
  });
}
```

**Benefits:**
- ✅ Users never experience token expiration errors
- ✅ Tokens refresh automatically in the background
- ✅ No user interaction required

#### Response

**Success:**
```json
{
  "result": "success"
}
```

**Error (caught by try/catch):**
```json
{
  "result": "error"
}
```

**Note:** This function is internal and uses try/catch to handle errors gracefully. If refresh fails, the user will need to reconnect via OAuth flow.

---

### 4. Get OAuth Status

**Xano Endpoint Path:** `/zoho/oauth/status`  
**Method:** GET  
**Authentication:** Required (JWT)  
**Purpose:** Check if user has connected Zoho and token validity

#### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

#### Logic Flow

```javascript
// 1. Get authenticated user ID from JWT token
const userId = authToken.user_id;

// 2. Get OAuth record from database
const oauthRecord = await zoho_oauth.findOne({ dappit_user_id: userId });

// 3. If no record exists, user hasn't connected
if (!oauthRecord) {
  return {
    connected: false,
    message: 'Zoho not connected'
  };
}

// 4. Check if access token is expired
const now = new Date();
const isExpired = now >= oauthRecord.token_expires_at;

// 5. Return connection status
return {
  connected: true,
  token_valid: !isExpired,
  expires_at: oauthRecord.token_expires_at,
  updated_at: oauthRecord.updated_at
};
```

#### Response

**Connected with valid token (200):**
```json
{
  "connected": true,
  "token_valid": true,
  "expires_at": "2025-10-02T15:30:00Z",
  "updated_at": "2025-10-02T14:30:00Z"
}
```

**Connected with expired token (200):**
```json
{
  "connected": true,
  "token_valid": false,
  "expires_at": "2025-10-02T13:30:00Z",
  "updated_at": "2025-10-02T12:30:00Z"
}
```

**Not connected (200):**
```json
{
  "connected": false,
  "message": "Zoho not connected"
}
```

---

### 5. Disconnect Zoho

**Xano Endpoint Path:** `/zoho/oauth/disconnect`  
**Method:** DELETE  
**Authentication:** Required (JWT)  
**Purpose:** Remove OAuth tokens and disconnect Zoho integration

#### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

#### Logic Flow

```javascript
// 1. Get authenticated user ID from JWT token
const userId = authToken.user_id;

// 2. Get OAuth record from database
const oauthRecord = await zoho_oauth.findOne({ dappit_user_id: userId });

if (!oauthRecord) {
  return {
    success: true,
    message: 'Already disconnected'
  };
}

// 3. Delete OAuth record
await zoho_oauth.delete({ id: oauthRecord.id });

// 4. Return success
return {
  success: true,
  message: 'Zoho disconnected successfully'
};
```

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Zoho disconnected successfully"
}
```

---

## Helper Function: Get Valid Access Token

**Xano Function:** `oauth/get_valid_token` (recommended name)  
**Type:** Internal helper function  
**Purpose:** Get a valid access token for making Zoho API calls

**Note:** With your scheduled task automatically refreshing tokens 15 minutes before expiry, this function can be simplified to just retrieve the token. However, you may still want a fallback refresh check.

```javascript
async function getValidAccessToken(userId) {
  // 1. Get OAuth record
  const oauthRecord = await db.query('zoho_oauth', {
    where: { dappit_user_id: userId }
  });
  
  if (!oauthRecord || oauthRecord.length === 0) {
    throw new Error('Zoho not connected');
  }
  
  const oauth = oauthRecord[0];
  
  // 2. Check if token is expired or expiring soon (within 5 minutes)
  const now = new Date();
  const expiryBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  const willExpireSoon = (oauth.token_expires_at - now) < expiryBuffer;
  
  // 3. If expired or expiring soon, refresh immediately
  if (willExpireSoon) {
    await function.run('oauth/token_refresh', {
      zoho_oauth_id: oauth.id
    });
    
    // Re-fetch the updated token
    const updatedRecord = await db.get('zoho_oauth', {
      field_name: 'id',
      field_value: oauth.id
    });
    
    return updatedRecord.access_token;
  }
  
  // 4. Return existing valid token
  return oauth.access_token;
}
```

**Usage in other endpoints:**

```javascript
// Example: List Zoho Books projects
const accessToken = await getValidAccessToken($auth.id);

const projects = await api.request({
  url: 'https://www.zohoapis.eu/books/v3/projects',
  method: 'GET',
  headers: [
    'Authorization: Zoho-oauthtoken ' + accessToken
  ]
});
```

---

## Environment Variables Required

Add these to your Xano environment:

```
MULTI_TIMER_ZOHO_CLIENT_ID=1000.YOUR_CLIENT_ID_FROM_ZOHO
MULTI_TIMER_ZOHO_SECRET=your_client_secret_from_zoho
```

**Note:** Redirect URI is dynamically determined based on the request origin (localhost vs production), so no need to configure it as an environment variable.

### Scheduled Task Configuration

Enable the token refresh task in Xano:

1. Navigate to **Tasks** → `zoho/oauth/refresh_api_tokens`
2. Set **Active** to `true`
3. Configure schedule (recommended: every 15 minutes)
4. This will automatically refresh tokens before they expire

---

## OAuth Flow Diagram

```
User clicks "Connect Zoho"
        ↓
Frontend calls GET /zoho/oauth/initiate
        ↓
Xano returns authorization_url
        ↓
Frontend redirects to Zoho login
        ↓
User logs into Zoho and authorizes
        ↓
Zoho redirects to your redirect_uri with code
        ↓
Frontend calls POST /zoho/oauth/callback with code
        ↓
Xano exchanges code for tokens
        ↓
Xano stores tokens in zoho_oauth table
        ↓
Frontend shows "Connected" status
        ↓
For API calls: getValidAccessToken() auto-refreshes if expired
```

---

## Testing the OAuth Flow

### 1. Test Initiate Endpoint

```bash
curl -X GET https://api.dappit.org/api:[ZOHO_GROUP_ID]/zoho/oauth/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Visit Authorization URL

Copy the `authorization_url` from response and open in browser

### 3. After Zoho Redirect

Zoho will redirect to:
```
http://localhost:3000/integrations/zoho/callback?code=1000.abc123...&state=123&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com
```

### 4. Test Callback Endpoint

```bash
curl -X POST https://api.dappit.org/api:[ZOHO_GROUP_ID]/zoho/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "1000.abc123...",
    "state": "123",
    "location": "us",
    "accounts_server": "https://accounts.zoho.com"
  }'
```

### 5. Check Status

```bash
curl -X GET https://api.dappit.org/api:[ZOHO_GROUP_ID]/zoho/oauth/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Next Steps After OAuth Works

Once OAuth is working, you'll add these endpoints:
- `GET /zoho/projects` - List Zoho Books projects
- `POST /zoho/time-entries` - Create time entry in Zoho Books
- `GET /zoho/sync-status` - Check sync queue status

But for now, focus on getting these 5 OAuth endpoints working first!

