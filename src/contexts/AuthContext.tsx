"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  authAPI,
  authClient,
  User,
  LoginCredentials,
  SignupCredentials,
  AuthError,
} from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (authClient.isAuthenticated()) {
          const verifiedUser = await authAPI.verifyToken();
          setUser(verifiedUser);
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setIsLoading(true);
      const {user: loggedInUser} = await authAPI.login(credentials);
      setUser(loggedInUser);
    } catch (err) {
      const errorMessage =
        err instanceof AuthError
          ? err.message
          : "Login failed. Please try again.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      setError(null);
      setIsLoading(true);
      const {user: newUser} = await authAPI.signup(credentials);
      setUser(newUser);
    } catch (err) {
      const errorMessage =
        err instanceof AuthError
          ? err.message
          : "Signup failed. Please try again.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
