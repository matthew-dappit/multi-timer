# Authentication Guide

Complete guide to the authentication system in Multi-Timer.

---

## Overview

Multi-Timer uses JWT token-based authentication with Xano backend. Users must authenticate to access the timer interface.

---

## Features

### ✅ Implemented

- **User Registration** - Create new accounts with email/password
- **User Login** - Authenticate with credentials
- **Session Persistence** - Stay logged in across page refreshes
- **Token Storage** - Secure JWT token management
- **Protected Routes** - Restrict access to authenticated users only
- **User Profile** - Display user info in navbar
- **Secure Logout** - Clear tokens and redirect to login

---

## Architecture

### Components

```
AuthContext (Provider)
    ├── State Management
    │   ├── user: User | null
    │   ├── token: string | null
    │   └── isLoading: boolean
    │
    ├── Methods
    │   ├── login(email, password)
    │   ├── signup(userData)
    │   ├── logout()
    │   └── verifyToken(token)
    │
    └── Consumers
        ├── ProtectedRoute
        ├── AuthForm
        └── Navbar
```

### Flow Diagram

```
App Load
    ↓
Check localStorage for token
    ↓
    ├─→ Token exists ─→ Verify with backend
    │                       ↓
    │                   ├─→ Valid ─→ Load user & timers
    │                   └─→ Invalid ─→ Show login
    │
    └─→ No token ─→ Show login

User Login
    ↓
Submit credentials
    ↓
Backend validates
    ↓
Return JWT token + user data
    ↓
Store in localStorage
    ↓
Update AuthContext
    ↓
Show timer interface
```

---

## Implementation

### 1. AuthContext Setup

**File**: `src/contexts/AuthContext.tsx`

```typescript
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    localStorage.setItem('auth_token', data.authToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setToken(data.authToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 2. Protected Routes

**File**: `src/components/ProtectedRoute.tsx`

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  fallback = <AuthForm /> 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### 3. Login/Signup Form

**File**: `src/components/AuthForm.tsx`

```typescript
export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup({ firstName, lastName, email, password });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      {mode === 'signup' && (
        <>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            required
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            required
          />
        </>
      )}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        minLength={6}
      />

      {error && <div className="text-red-500">{error}</div>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Sign Up'}
      </button>

      <button type="button" onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'Create an account' : 'Already have an account?'}
      </button>
    </form>
  );
}
```

### 4. Integration in App

**File**: `src/app/layout.tsx`

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**File**: `src/app/page.tsx`

```typescript
export default function Home() {
  return (
    <ProtectedRoute>
      <MultiTimer />
    </ProtectedRoute>
  );
}
```

---

## Xano Backend Setup

### Required Endpoints

#### 1. User Signup
```
POST /auth/signup

Request:
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "securepassword"
}

Response:
{
  "authToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }
}
```

#### 2. User Login
```
POST /auth/login

Request:
{
  "email": "john@example.com",
  "password": "securepassword"
}

Response:
{
  "authToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }
}
```

#### 3. Get Current User
```
GET /auth/me

Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response:
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com"
}
```

### Xano Configuration Steps

1. **Create Users Table:**
   - id (integer, auto-increment)
   - first_name (text)
   - last_name (text)
   - email (text, unique)
   - password (text, hashed)
   - created_at (timestamp)

2. **Enable Authentication Addon:**
   - Go to Add-ons → Authentication
   - Enable JWT authentication
   - Set token expiration (recommended: 30 days)

3. **Create API Endpoints:**
   - Signup: POST endpoint with password hashing
   - Login: POST endpoint with credential verification
   - Get Me: GET endpoint with auth requirement

4. **Configure CORS:**
   - Allow your frontend domain
   - Include credentials
   - Allow Authorization header

---

## Security Best Practices

### Token Storage

**✅ Current Implementation:**
```typescript
// Store in localStorage (acceptable for demo/MVP)
localStorage.setItem('auth_token', token);
```

**🔒 Production Recommendation:**
```typescript
// Use httpOnly cookies (more secure)
// Set by backend, not accessible to JavaScript
document.cookie = `auth_token=${token}; HttpOnly; Secure; SameSite=Strict`;
```

### Password Requirements

```typescript
// Minimum length validation
const isValidPassword = (password: string) => {
  return password.length >= 6;
};

// Stronger validation (future)
const isStrongPassword = (password: string) => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&  // Uppercase
    /[a-z]/.test(password) &&  // Lowercase
    /[0-9]/.test(password) &&  // Number
    /[^A-Za-z0-9]/.test(password)  // Special char
  );
};
```

### Token Expiration

```typescript
// Check token expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Auto-refresh before expiration
useEffect(() => {
  const interval = setInterval(() => {
    if (token && isTokenExpired(token)) {
      refreshToken();
    }
  }, 60000); // Check every minute

  return () => clearInterval(interval);
}, [token]);
```

---

## Testing Authentication

### Manual Testing

**Test Signup:**
1. Go to app without auth
2. Click "Create an account"
3. Fill in all fields
4. Submit form
5. ✅ Should log in automatically
6. ✅ Should see timer interface
7. ✅ Should see user name in navbar

**Test Login:**
1. Log out
2. Enter credentials
3. Click "Log In"
4. ✅ Should see timer interface
5. ✅ Token should be in localStorage

**Test Session Persistence:**
1. While logged in, refresh page
2. ✅ Should stay logged in
3. ✅ Should not show login form

**Test Logout:**
1. Click logout button
2. ✅ Should clear token
3. ✅ Should show login form
4. ✅ Should not be able to access timers

**Test Protected Routes:**
1. Log out
2. Try to access timer URL directly
3. ✅ Should redirect to login

### Error Scenarios

**Invalid Credentials:**
```typescript
// Expected behavior:
// - Show error message
// - Don't clear form
// - Allow retry
```

**Network Failure:**
```typescript
// Expected behavior:
// - Show "Network error" message
// - Don't log user out
// - Allow retry
```

**Expired Token:**
```typescript
// Expected behavior:
// - Clear token
// - Show login form
// - Preserve timer data locally
```

---

## Troubleshooting

### Common Issues

**Issue: Can't log in**
- Check Xano API URL in `.env.local`
- Verify endpoint paths match Xano setup
- Check network tab for API errors
- Ensure CORS is configured in Xano

**Issue: Token not persisting**
- Check if localStorage is enabled
- Verify not in private/incognito mode
- Check for JavaScript errors in console

**Issue: Logged out after refresh**
- Verify token is in localStorage
- Check if token has expired
- Ensure AuthProvider wraps entire app

**Issue: "User not authenticated" errors**
- Check if token is being sent in requests
- Verify token format (Bearer token)
- Check Xano auth middleware

---

## Future Enhancements

### Planned Security Improvements

1. **OAuth Integration**
   - Google Sign-In
   - GitHub Sign-In
   - Microsoft/Azure AD

2. **Two-Factor Authentication**
   - Email verification codes
   - SMS verification
   - Authenticator app support

3. **Password Reset**
   - Email-based reset flow
   - Security questions
   - Temporary reset tokens

4. **Session Management**
   - View active sessions
   - Revoke specific sessions
   - Force logout all devices

5. **Account Management**
   - Change password
   - Change email
   - Delete account
   - Export user data

---

## API Reference

See `src/lib/auth.ts` for complete implementation.

### Functions

**login(email, password)**
```typescript
const user = await login('user@example.com', 'password');
```

**signup(userData)**
```typescript
const user = await signup({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'securepassword'
});
```

**logout()**
```typescript
logout(); // Clears token and user data
```

**verifyToken(token)**
```typescript
const isValid = await verifyToken(token);
```

---

**Last Updated**: October 1, 2025
