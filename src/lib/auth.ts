// Authentication utility functions

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_BASE_URL;

export interface User {
  id: number;
  created_at: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  authToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  first_name: string;
  last_name: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// Storage keys
const TOKEN_KEY = "multi-timer-auth-token";
const USER_KEY = "multi-timer-user";

// Client-side auth functions
export const authClient = {
  // Store auth token
  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  // Get auth token
  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  // Remove auth token
  removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  // Store user data
  setUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  // Get user data
  getUser(): User | null {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

// API functions
export const authAPI = {
  // Login
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AuthError(
        response.status === 401 ? "Invalid email or password" : error || "Login failed",
        response.status
      );
    }

    const data: AuthResponse = await response.json();
    authClient.setToken(data.authToken);

    // Fetch user data
    const user = await this.getCurrentUser(data.authToken);
    authClient.setUser(user);

    return { user, token: data.authToken };
  },

  // Signup
  async signup(credentials: SignupCredentials): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AuthError(error || "Signup failed", response.status);
    }

    const data: AuthResponse = await response.json();
    authClient.setToken(data.authToken);

    // Fetch user data
    const user = await this.getCurrentUser(data.authToken);
    authClient.setUser(user);

    return { user, token: data.authToken };
  },

  // Get current user
  async getCurrentUser(token?: string): Promise<User> {
    const authToken = token || authClient.getToken();
    if (!authToken) {
      throw new AuthError("No authentication token found", 401);
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        authClient.removeToken();
        throw new AuthError("Session expired. Please login again.", 401);
      }
      throw new AuthError("Failed to fetch user data", response.status);
    }

    const user: User = await response.json();
    return user;
  },

  // Logout
  async logout(): Promise<void> {
    authClient.removeToken();
  },

  // Verify token validity
  async verifyToken(): Promise<User | null> {
    try {
      const user = await this.getCurrentUser();
      authClient.setUser(user);
      return user;
    } catch {
      authClient.removeToken();
      return null;
    }
  },
};
