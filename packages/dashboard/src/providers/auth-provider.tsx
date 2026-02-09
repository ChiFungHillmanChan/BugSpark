"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { setAccessToken } from "@/lib/api-client";
import {
  loginApi,
  registerApi,
  refreshApi,
  getMeApi,
} from "@/lib/auth";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const refreshToken = localStorage.getItem("bugspark_refresh_token");
    if (!refreshToken) {
      setIsLoading(false);
      return;
    }

    refreshApi(refreshToken)
      .then((data) => {
        setAccessToken(data.accessToken);
        localStorage.setItem("bugspark_refresh_token", data.refreshToken);
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem("bugspark_refresh_token");
        setAccessToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await loginApi(email, password);
      setAccessToken(data.accessToken);
      localStorage.setItem("bugspark_refresh_token", data.refreshToken);
      setUser(data.user);
      router.push("/dashboard");
    },
    [router],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await registerApi(name, email, password);
      setAccessToken(data.accessToken);
      localStorage.setItem("bugspark_refresh_token", data.refreshToken);
      setUser(data.user);
      router.push("/dashboard");
    },
    [router],
  );

  const logout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem("bugspark_refresh_token");
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
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
