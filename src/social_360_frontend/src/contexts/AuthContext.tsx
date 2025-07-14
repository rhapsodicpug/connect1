import React, { createContext, useContext, useState, useEffect } from "react";
import * as backend from "../backend/social360";
import { AuthClient } from "@dfinity/auth-client";

interface User {
  id: string; // principal
  handle: string;
  principal: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  mockLogin: () => Promise<void>;
  logout: () => void;
  loginWithII: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthErrorContextType {
  error: string | null;
  clearError: () => void;
}

const AuthErrorContext = createContext<AuthErrorContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useAuthError = () => {
  const context = useContext(AuthErrorContext);
  if (!context) {
    throw new Error("useAuthError must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Always use mock principal for guest login
      const principal = await backend.getPrincipal();

      // Try to fetch user profile from backend
      let profile = await backend.getUser(principal);
      let handle = "";

      if (
        profile &&
        Array.isArray(profile) &&
        profile[0] &&
        profile[0].handle
      ) {
        handle = profile[0].handle;
      } else if (
        profile &&
        typeof profile === "object" &&
        "handle" in profile
      ) {
        handle = (profile as any).handle;
      } else {
        // If not registered, register with a default handle
        handle = `user_${principal.slice(0, 8)}`;
        try {
          await backend.register(handle);
          // Fetch again to ensure registration
          profile = await backend.getUser(principal);
          if (
            profile &&
            Array.isArray(profile) &&
            profile[0] &&
            profile[0].handle
          ) {
            handle = profile[0].handle;
          } else if (
            profile &&
            typeof profile === "object" &&
            "handle" in profile
          ) {
            handle = (profile as any).handle;
          }
        } catch (registerError) {
          console.error("Registration failed:", registerError);
          // Continue with default handle if registration fails
        }
      }

      const newUser: User = {
        id: principal,
        handle,
        principal,
      };
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    } catch (error: any) {
      console.error("Login failed:", error);
      setError(error?.message || "Login failed");
      // Don't set user to null on error, just log it
      // This allows the app to continue with guest mode
    } finally {
      setIsLoading(false);
    }
  };

  const mockLogin = async () => {
    // For local development, both login and mockLogin work the same way
    await login();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setError(null);
  };

  const loginWithII = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authClient = await AuthClient.create();
      await authClient.login({
        identityProvider: "https://identity.ic0.app/#authorize",
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          const principal = identity.getPrincipal().toText();

          // Try to fetch user profile from backend
          let profile = await backend.getUser(principal);
          let handle = "";

          if (
            profile &&
            Array.isArray(profile) &&
            profile[0] &&
            profile[0].handle
          ) {
            handle = profile[0].handle;
          } else if (
            profile &&
            typeof profile === "object" &&
            "handle" in profile
          ) {
            handle = (profile as any).handle;
          } else {
            // If not registered, register with a default handle
            handle = `user_${principal.slice(0, 8)}`;
            try {
              await backend.register(handle);
              // Fetch again to ensure registration
              profile = await backend.getUser(principal);
              if (
                profile &&
                Array.isArray(profile) &&
                profile[0] &&
                profile[0].handle
              ) {
                handle = profile[0].handle;
              } else if (
                profile &&
                typeof profile === "object" &&
                "handle" in profile
              ) {
                handle = (profile as any).handle;
              }
            } catch (registerError) {
              console.error("Registration failed:", registerError);
              // Continue with default handle if registration fails
            }
          }

          const newUser: User = {
            id: principal,
            handle,
            principal,
          };
          setUser(newUser);
          localStorage.setItem("user", JSON.stringify(newUser));
          setIsLoading(false);
        },
        onError: (err) => {
          setError("Internet Identity login failed");
          setIsLoading(false);
        },
      });
    } catch (error: any) {
      setError(error?.message || "Internet Identity login failed");
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        mockLogin,
        logout,
        loginWithII, // Export the new function
      }}
    >
      <AuthErrorContext.Provider value={{ error, clearError }}>
        {children}
      </AuthErrorContext.Provider>
    </AuthContext.Provider>
  );
};

// Add plug wallet types
declare global {
  interface Window {
    ic?: {
      plug?: {
        requestConnect: () => Promise<boolean>;
        agent: {
          getPrincipal: () => Promise<any>;
        };
        createActor?: (args: any) => any;
      };
    };
  }
}
