import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/server
const mockRedirect = vi.fn();
const mockNext = vi.fn();
const mockCookiesSet = vi.fn();

vi.mock("next/server", () => {
  return {
    NextResponse: {
      redirect: (...args: unknown[]) => {
        mockRedirect(...args);
        return { cookies: { set: mockCookiesSet } };
      },
      next: () => {
        const resp = { cookies: { set: mockCookiesSet } };
        mockNext();
        return resp;
      },
    },
  };
});

vi.mock("@/i18n/config", () => ({
  LOCALE_COOKIE_NAME: "bugspark_locale",
  defaultLocale: "en",
  locales: ["en", "zh-TW"],
}));

import { middleware, config } from "@/middleware";

function createMockRequest(
  pathname: string,
  cookies: Record<string, string> = {},
): unknown {
  return {
    nextUrl: { pathname },
    url: `http://localhost:3000${pathname}`,
    cookies: {
      has: (name: string) => name in cookies,
      get: (name: string) =>
        cookies[name] ? { value: cookies[name] } : undefined,
    },
  };
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("dashboard route protection", () => {
    it("redirects unauthenticated user from /dashboard", () => {
      const request = createMockRequest("/dashboard");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("redirect")).toBe("/dashboard");
    });

    it("redirects unauthenticated user from /bugs", () => {
      const request = createMockRequest("/bugs");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("redirect")).toBe("/bugs");
    });

    it("redirects unauthenticated user from /projects", () => {
      const request = createMockRequest("/projects");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.searchParams.get("redirect")).toBe("/projects");
    });

    it("redirects unauthenticated user from /settings", () => {
      const request = createMockRequest("/settings");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.searchParams.get("redirect")).toBe("/settings");
    });

    it("redirects unauthenticated user from /admin", () => {
      const request = createMockRequest("/admin");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.searchParams.get("redirect")).toBe("/admin");
    });

    it("redirects from nested routes like /settings/tokens", () => {
      const request = createMockRequest("/settings/tokens");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("redirect")).toBe("/settings/tokens");
    });

    it("redirects from nested routes like /admin/users", () => {
      const request = createMockRequest("/admin/users");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.searchParams.get("redirect")).toBe("/admin/users");
    });

    it("includes original path as ?redirect= param in redirect URL", () => {
      const request = createMockRequest("/projects/abc-123");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("redirect")).toBe("/projects/abc-123");
    });
  });

  describe("authenticated access", () => {
    it("allows authenticated user through dashboard routes", () => {
      const request = createMockRequest("/dashboard", {
        bugspark_access_token: "valid-token",
      });

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("allows authenticated user through nested dashboard routes", () => {
      const request = createMockRequest("/settings/tokens", {
        bugspark_access_token: "valid-token",
      });

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("public routes", () => {
    it("does NOT redirect from / (root)", () => {
      const request = createMockRequest("/");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("does NOT redirect from /login", () => {
      const request = createMockRequest("/login");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("does NOT redirect from /register", () => {
      const request = createMockRequest("/register");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("does NOT redirect from /docs", () => {
      const request = createMockRequest("/docs");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("locale cookie handling", () => {
    it("sets locale cookie if missing", () => {
      const request = createMockRequest("/");

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockCookiesSet).toHaveBeenCalledWith(
        "bugspark_locale",
        "en",
        { path: "/", maxAge: 31536000, sameSite: "lax" },
      );
    });

    it("sets locale cookie if value is invalid", () => {
      const request = createMockRequest("/", {
        bugspark_locale: "invalid-locale",
      });

      middleware(request as Parameters<typeof middleware>[0]);

      expect(mockCookiesSet).toHaveBeenCalledWith(
        "bugspark_locale",
        "en",
        { path: "/", maxAge: 31536000, sameSite: "lax" },
      );
    });

    it("does not overwrite valid locale cookie (zh-TW)", () => {
      const request = createMockRequest("/", {
        bugspark_locale: "zh-TW",
      });

      middleware(request as Parameters<typeof middleware>[0]);

      // mockCookiesSet should NOT have been called with bugspark_locale
      const localeCalls = mockCookiesSet.mock.calls.filter(
        (call: unknown[]) => call[0] === "bugspark_locale",
      );
      expect(localeCalls).toHaveLength(0);
    });

    it("does not overwrite valid locale cookie (en)", () => {
      const request = createMockRequest("/", {
        bugspark_locale: "en",
      });

      middleware(request as Parameters<typeof middleware>[0]);

      const localeCalls = mockCookiesSet.mock.calls.filter(
        (call: unknown[]) => call[0] === "bugspark_locale",
      );
      expect(localeCalls).toHaveLength(0);
    });
  });

  describe("config", () => {
    it("exports a matcher config", () => {
      expect(config).toBeDefined();
      expect(config.matcher).toBeDefined();
      expect(Array.isArray(config.matcher)).toBe(true);
    });
  });
});
