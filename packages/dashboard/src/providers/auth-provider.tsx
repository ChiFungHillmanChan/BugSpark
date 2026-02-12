"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  loginApi,
  registerApi,
  logoutApi,
  getMeApi,
  type RegisterResult,
} from "@/lib/auth";
import {
  setSessionIndicator,
  clearSessionIndicator,
  hasSessionIndicator,
} from "@/lib/auth-session";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperadmin: boolean;
  login: (email: string, password: string, redirectTo?: string) => Promise<void>;
  register: (name: string, email: string, password: string, redirectTo?: string) => Promise<RegisterResult>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Only allow redirects to local paths (starts with "/" but not "//"). */
function isSafeRedirect(path: string | undefined): path is string {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!hasSessionIndicator()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    getMeApi()
      .then((data) => setUser(data))
      .catch(() => {
        clearSessionIndicator();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      const data = await loginApi(email, password);
      setSessionIndicator();
      setUser(data);
      router.push(isSafeRedirect(redirectTo) ? redirectTo : "/dashboard");
    },
    [router],
  );

  const register = useCallback(
    async (name: string, email: string, password: string, redirectTo?: string): Promise<RegisterResult> => {
      const result = await registerApi(name, email, password);
      if (result.kind === "user") {
        setSessionIndicator();
        setUser(result.user);
        router.push(isSafeRedirect(redirectTo) ? redirectTo : "/dashboard");
      }
      // When kind === "beta", the caller (register page) handles the UI
      return result;
    },
    [router],
  );

  const refreshUser = useCallback(() => {
    getMeApi()
      .then((data) => setUser(data))
      .catch(() => {
        // Ignore errors — user state stays as-is
      });
  }, []);

  const logout = useCallback(async () => {
    // Always clear local state and redirect, even if the API call fails
    // (e.g. expired token, network error). The server session will expire on its own.
    try {
      await logoutApi();
    } catch {
      // Intentionally ignored – local cleanup is what matters
    }
    clearSessionIndicator();
    setUser(null);
    router.push("/");
  }, [router]);

  const isSuperadmin = useMemo(() => user?.role === "superadmin", [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isSuperadmin,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
