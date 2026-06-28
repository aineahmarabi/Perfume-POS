import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { Id } from "../../convex/_generated/dataModel";

interface AuthUser {
  _id: Id<"users">;
  name: string;
  email: string;
  role: "admin" | "cashier";
  phone?: string;
}

interface AuthSession {
  user: AuthUser;
  expiresAt: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
  isAdmin: boolean;
  isCashier: boolean;
}

const SESSION_KEY = "perfume_pos_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const session: AuthSession = JSON.parse(raw);
        if (Date.now() < session.expiresAt) {
          setUser(session.user);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData: AuthUser) => {
    const session: AuthSession = {
      user: userData,
      expiresAt: Date.now() + SESSION_DURATION,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAdmin: user?.role === "admin",
      isCashier: user?.role === "cashier",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
