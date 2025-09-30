# Authentication Implementation Guide

## Overview
This document describes the authentication system implemented for the Multi-Timer application using Xano backend authentication.

---

## Features Implemented

### ✅ User Authentication
- **Login**: Users can log in with email and password
- **Signup**: New users can create an account with first name, last name, email, and password
- **Logout**: Users can securely log out
- **Session Persistence**: Auth tokens are stored in localStorage for persistent sessions
- **Auto-verification**: Token validation on app load to restore user sessions

### ✅ Protected Routes
- Unauthenticated users see the login/signup form
- Authenticated users can access the multi-timer
- Loading states during authentication checks

### ✅ User Interface
- Clean, modern login/signup forms
- Toggle between login and signup modes
- Form validation with helpful error messages
- User info displayed in navbar
- Logout button in navbar

---

## File Structure

```
src/
├── lib/
│   └── auth.ts                    # Core authentication utilities
├── contexts/
│   └── AuthContext.tsx            # React Context for auth state management
├── components/
│   ├── AuthForm.tsx               # Login/Signup form component
│   ├── ProtectedRoute.tsx         # Route protection wrapper
│   └── Navbar.tsx                 # Updated with user info & logout
├── app/
│   ├── layout.tsx                 # Wrapped with AuthProvider
│   └── page.tsx                   # Protected home page
└── .env.local                     # Environment variables (not committed)
```

---

## API Endpoints Used

### Base URL
```
https://api.dappit.org/api:vsVOMFSf
```

### 1. **POST** `/auth/login`
**Purpose**: Authenticate user and receive JWT token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. **POST** `/auth/signup`
**Purpose**: Create new user account and receive JWT token

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response**:
```json
{
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. **GET** `/auth/me`
**Purpose**: Get current user's information

**Headers**:
```
Authorization: Bearer {authToken}
```

**Response**:
```json
{
  "id": 1,
  "created_at": 1696118400000,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

---

## Authentication Flow

### Login Flow
1. User enters email and password
2. `AuthForm` calls `useAuth().login()`
3. `login()` sends POST to `/auth/login`
4. Receive `authToken` from response
5. Store token in localStorage
6. Call `/auth/me` to fetch user data
7. Store user data in context and localStorage
8. User is redirected to multi-timer

### Signup Flow
1. User enters email, password, first name, last name
2. `AuthForm` calls `useAuth().signup()`
3. `signup()` sends POST to `/auth/signup`
4. Receive `authToken` from response
5. Store token in localStorage
6. Call `/auth/me` to fetch user data
7. Store user data in context and localStorage
8. User is redirected to multi-timer

### Session Restoration
1. App loads, `AuthProvider` mounts
2. Check if token exists in localStorage
3. If yes, call `authAPI.verifyToken()`
4. Verify token by calling `/auth/me`
5. If valid, restore user session
6. If invalid, clear localStorage and show login

### Logout Flow
1. User clicks logout button in navbar
2. `useAuth().logout()` is called
3. Clear token and user data from localStorage
4. Clear user from context state
5. User is redirected to login page

---

## Component Usage

### Using Auth Context
```tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.first_name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes
```tsx
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute fallback={<LoginForm />}>
      <YourProtectedContent />
    </ProtectedRoute>
  );
}
```

---

## Security Features

### ✅ Implemented
- Passwords are sent over HTTPS only
- JWT tokens stored in localStorage (client-side only)
- Bearer token authentication for API requests
- Token validation on app load
- Automatic session cleanup on logout
- Form validation (email format, password length)

### 🔒 Best Practices
- Never commit `.env.local` to version control
- Tokens expire after a period (managed by Xano)
- Use HTTPS in production
- Validate all user inputs

---

## LocalStorage Keys

The app uses the following localStorage keys:

| Key | Purpose | Data Type |
|-----|---------|-----------|
| `multi-timer-auth-token` | JWT authentication token | string |
| `multi-timer-user` | Cached user data | JSON string |
| `multi-timer/state` | Timer groups state | JSON string (existing) |
| `multi-timer/running` | Running timer session | JSON string (existing) |

---

## Error Handling

### Common Errors

**401 Unauthorized**
- Invalid credentials during login
- Expired or invalid token
- Action: Show error message, redirect to login

**400 Bad Request**
- Invalid email format
- Missing required fields
- Password too short
- Action: Show validation error to user

**500 Internal Server Error**
- Backend error
- Action: Show generic error, allow retry

---

## Testing the Authentication

### Manual Testing Steps

1. **Test Signup**:
   - Go to app homepage
   - Click "Sign up"
   - Enter valid details
   - Submit form
   - Should redirect to multi-timer

2. **Test Login**:
   - Logout if logged in
   - Enter credentials
   - Submit form
   - Should redirect to multi-timer

3. **Test Session Persistence**:
   - Login
   - Refresh the page
   - Should remain logged in

4. **Test Logout**:
   - Click logout button in navbar
   - Should redirect to login page
   - Refresh page should keep you logged out

5. **Test Protected Routes**:
   - Logout
   - Try to access homepage
   - Should show login form

---

## Environment Variables

### Setup Instructions

1. Create `.env.local` in project root:
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.dappit.org/api:vsVOMFSf
```

2. Restart Next.js dev server:
```bash
npm run dev
```

### Using in Code
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
```

Note: `NEXT_PUBLIC_` prefix makes the variable available in client-side code.

---

## Future Enhancements

### Potential Features
- [ ] Password reset/forgot password
- [ ] Email verification
- [ ] Remember me checkbox (extended session)
- [ ] Social login (Google, GitHub, etc.)
- [ ] Two-factor authentication (2FA)
- [ ] Account settings page
- [ ] Profile picture upload
- [ ] Password change functionality
- [ ] Session timeout warning
- [ ] Multiple device sessions management

---

## Integration with Timer Data

### Next Steps for User-Specific Timers

Currently, timer data is stored in localStorage without user association. To make timers user-specific:

1. **Create Timer Backend API**:
   - `POST /timers` - Create timer
   - `GET /timers` - Get user's timers
   - `PUT /timers/:id` - Update timer
   - `DELETE /timers/:id` - Delete timer

2. **Update MultiTimer Component**:
   ```typescript
   const { user } = useAuth();
   
   // Load timers from API instead of localStorage
   useEffect(() => {
     if (user) {
       fetchUserTimers(user.id);
     }
   }, [user]);
   ```

3. **Sync on Changes**:
   - Auto-save to backend when timers change
   - Fetch from backend on login
   - Clear local storage on logout

---

## Troubleshooting

### Issue: "Network request failed"
**Cause**: API base URL incorrect or backend down
**Solution**: Verify `.env.local` has correct URL, check backend status

### Issue: "Session expired" after refresh
**Cause**: Token expired or invalid
**Solution**: Login again, tokens may have short expiry

### Issue: Form validation errors
**Cause**: Invalid input data
**Solution**: Check error messages, ensure email is valid and password is 6+ characters

### Issue: "CORS error"
**Cause**: Backend not allowing requests from frontend domain
**Solution**: Ensure Xano backend has CORS configured for your domain

---

## Code Examples

### Making Authenticated API Requests

```typescript
import { authClient } from "@/lib/auth";

async function fetchProtectedData() {
  const token = authClient.getToken();
  
  const response = await fetch(`${API_BASE_URL}/protected-endpoint`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  
  return response.json();
}
```

### Custom Auth Hook

```typescript
function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);
  
  return { isAuthenticated, isLoading };
}
```

---

## Database Schema Reference

### dappit_users Table
```typescript
{
  id: number;              // Primary key
  created_at: timestamp;   // Account creation time
  email: string;           // Unique, used for login
  password: string;        // Hashed password (managed by Xano)
  first_name: string;      // User's first name
  last_name: string;       // User's last name
}
```

---

## API Response Examples

### Successful Login
```json
{
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIn0.abc123"
}
```

### User Info
```json
{
  "id": 123,
  "created_at": 1696118400000,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

### Error Response
```json
{
  "message": "Invalid email or password",
  "code": 401
}
```

---

## Summary

The authentication system is now fully integrated with:
- ✅ Xano backend authentication endpoints
- ✅ JWT token-based authentication
- ✅ Protected routes
- ✅ User session management
- ✅ Login/Signup forms
- ✅ User info in navbar
- ✅ Secure logout

The app is ready for user authentication! Users must create an account or login to access the multi-timer functionality.

---

*Last Updated: September 30, 2025*
