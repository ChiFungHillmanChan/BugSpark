import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import type { User } from "@/types";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockGetMe = vi.fn();
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
vi.mock("@/lib/auth", () => ({
  getMeApi: (...args: unknown[]) => mockGetMe(...args),
  loginApi: (...args: unknown[]) => mockLogin(...args),
  registerApi: (...args: unknown[]) => mockRegister(...args),
  logoutApi: (...args: unknown[]) => mockLogout(...args),
}));

const testUser: User = {
  id: "1",
  name: "Test",
  email: "test@test.com",
  role: "user",
  plan: "free",
  isActive: true,
  createdAt: "2024-01-01",
};

const superadminUser: User = {
  ...testUser,
  id: "2",
  role: "superadmin",
};

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(AuthProvider, null, children);
  };
}

let fakeCookie = "";
const originalCookieDescriptor = Object.getOwnPropertyDescriptor(
  Document.prototype,
  "cookie",
);

function mockCookie(value: string) {
  fakeCookie = value;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fakeCookie = "";
    Object.defineProperty(document, "cookie", {
      get: () => fakeCookie,
      set: (val: string) => { fakeCookie = val; },
      configurable: true,
    });
    mockGetMe.mockRejectedValue(new Error("Not authenticated"));
  });

  afterEach(() => {
    if (originalCookieDescriptor) {
      Object.defineProperty(document, "cookie", originalCookieDescriptor);
    }
  });

  describe("initial state", () => {
    it("skips getMeApi and resolves immediately when no access token cookie exists", async () => {
      mockGetMe.mockResolvedValueOnce(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockGetMe).not.toHaveBeenCalled();
    });

    it("isAuthenticated starts false and transitions to true after getMeApi resolves", async () => {
      mockCookie("bugspark_access_token=fake_token");
      mockGetMe.mockResolvedValueOnce(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isAuthenticated).toBe(false);

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.user).toEqual(testUser);
    });

    it("isLoading starts true and becomes false after getMeApi resolves", async () => {
      mockCookie("bugspark_access_token=fake_token");
      mockGetMe.mockResolvedValueOnce(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("isLoading becomes false even when getMeApi rejects", async () => {
      mockCookie("bugspark_access_token=fake_token");
      mockGetMe.mockRejectedValueOnce(new Error("Unauthorized"));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe("login", () => {
    it("sets user and navigates to /dashboard", async () => {
      mockGetMe.mockRejectedValueOnce(new Error("Not authenticated"));
      mockLogin.mockResolvedValueOnce(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("test@test.com", "password123");
      });

      expect(result.current.user).toEqual(testUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("navigates to safe redirect path like /projects", async () => {
      mockGetMe.mockRejectedValueOnce(new Error("Not authenticated"));
      mockLogin.mockResolvedValueOnce(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("test@test.com", "password123", "/projects");
      });

      expect(mockPush).toHaveBeenCalledWith("/projects");
    });

    it("falls back to /dashboard with unsafe redirect //evil.com", async () => {
      mockGetMe.mockRejectedValueOnce(new Error("Not authenticated"));
      mockLogin.mockResolvedValueOnce(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("test@test.com", "password123", "//evil.com");
      });

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("falls back to /dashboard with protocol redirect https://evil.com", async () => {
      mockGetMe.mockRejectedValueOnce(new Error("Not authenticated"));
      mockLogin.mockResolvedValueOnce(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login(
          "test@test.com",
          "password123",
          "https://evil.com",
        );
      });

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("register", () => {
    it("with 'user' result sets user and navigates", async () => {
      mockGetMe.mockRejectedValueOnce(new Error("Not authenticated"));
      // registerApi returns RegisterResult, so mock must return the wrapped form
      mockRegister.mockResolvedValueOnce({ kind: "user", user: testUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let registerResult: unknown;
      await act(async () => {
        registerResult = await result.current.register(
          "Test",
          "test@test.com",
          "password123",
        );
      });

      expect(result.current.user).toEqual(testUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(registerResult).toEqual({ kind: "user", user: testUser });
    });

    it("with 'beta' result does NOT set user", async () => {
      mockGetMe.mockRejectedValueOnce(new Error("Not authenticated"));
      const betaResponse = {
        betaStatus: "pending",
        message: "You have been added to the waitlist",
      };
      // registerApi returns RegisterResult, so mock must return the wrapped form
      mockRegister.mockResolvedValueOnce({
        kind: "beta",
        result: betaResponse,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let registerResult: unknown;
      await act(async () => {
        registerResult = await result.current.register(
          "Test",
          "test@test.com",
          "password123",
        );
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockPush).not.toHaveBeenCalled();
      expect(registerResult).toEqual({
        kind: "beta",
        result: betaResponse,
      });
    });
  });

  describe("logout", () => {
    it("clears user even if logoutApi throws", async () => {
      mockCookie("bugspark_access_token=fake_token");
      mockGetMe.mockResolvedValueOnce(testUser);
      mockLogout.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  describe("isSuperadmin", () => {
    it("returns true when user role is superadmin", async () => {
      mockCookie("bugspark_access_token=fake_token");
      mockGetMe.mockResolvedValueOnce(superadminUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuperadmin).toBe(true);
    });

    it("returns false when user role is not superadmin", async () => {
      mockCookie("bugspark_access_token=fake_token");
      mockGetMe.mockResolvedValueOnce(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuperadmin).toBe(false);
    });

    it("returns false when user is null", async () => {
      mockGetMe.mockRejectedValueOnce(new Error("Unauthorized"));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuperadmin).toBe(false);
    });
  });

  describe("useAuth outside provider", () => {
    it("throws error when used outside AuthProvider", () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within an AuthProvider");
    });
  });
});
