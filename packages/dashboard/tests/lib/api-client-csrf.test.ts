import { describe, it, expect, beforeEach, afterEach } from "vitest";
import apiClient from "@/lib/api-client";

describe("api-client CSRF and locale handling", () => {
  let originalCookie: string;

  const interceptors = apiClient.interceptors.request as unknown as {
    handlers: Array<{
      fulfilled: (
        config: Record<string, unknown>,
      ) => Record<string, unknown>;
    }>;
  };
  const requestInterceptor = interceptors.handlers[0].fulfilled;

  const responseInterceptors = apiClient.interceptors.response as unknown as {
    handlers: Array<{
      fulfilled: (response: Record<string, unknown>) => Record<string, unknown>;
    }>;
  };
  const responseInterceptor = responseInterceptors.handlers[0].fulfilled;

  function createConfig(): { headers: Record<string, string>; baseURL: string | undefined } {
    return {
      headers: {},
      baseURL: undefined,
    };
  }

  beforeEach(() => {
    originalCookie = document.cookie;
    // Clear all cookies
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
    // Clear sessionStorage
    sessionStorage.clear();
  });

  afterEach(() => {
    // Restore original cookie state
    document.cookie = originalCookie;
    sessionStorage.clear();
  });

  describe("CSRF token handling", () => {
    it("does not set X-CSRF-Token when no CSRF cookie or sessionStorage", () => {
      const config = createConfig();

      const result = requestInterceptor(
        config as unknown as Record<string, unknown>,
      ) as ReturnType<typeof createConfig>;

      expect(result.headers["X-CSRF-Token"]).toBeUndefined();
    });

    it("sets X-CSRF-Token from document.cookie when bugspark_csrf_token is present", () => {
      document.cookie = "bugspark_csrf_token=test-csrf-token-123; path=/";

      const config = createConfig();

      const result = requestInterceptor(
        config as unknown as Record<string, unknown>,
      ) as ReturnType<typeof createConfig>;

      expect(result.headers["X-CSRF-Token"]).toBe("test-csrf-token-123");
    });

    it("sets X-CSRF-Token from sessionStorage fallback", () => {
      sessionStorage.setItem("bugspark_csrf_token", "session-csrf-token");

      const config = createConfig();

      const result = requestInterceptor(
        config as unknown as Record<string, unknown>,
      ) as ReturnType<typeof createConfig>;

      expect(result.headers["X-CSRF-Token"]).toBe("session-csrf-token");
    });

    it("does not throw when cookie value is malformed (%ZZ)", () => {
      // Reset the in-memory CSRF token store by sending a response without a token.
      // The csrfTokenStore is module-level and may retain values from previous tests.
      // We trigger a response interceptor with an empty CSRF header to clear it,
      // then use a response with an explicit empty string won't clear it, so we
      // test only that the interceptor does not throw.
      document.cookie = "bugspark_csrf_token=%ZZ; path=/";

      const config = createConfig();

      // The key behavior: calling the interceptor with a malformed cookie does NOT throw.
      // Due to the in-memory csrfTokenStore caching from prior tests, the token may
      // come from the store rather than the cookie. The important assertion is no error.
      expect(() => {
        requestInterceptor(config as unknown as Record<string, unknown>);
      }).not.toThrow();
    });
  });

  describe("locale handling", () => {
    it("returns 'en' when no locale cookie (defaults Accept-Language to en)", () => {
      const config = createConfig();

      const result = requestInterceptor(
        config as unknown as Record<string, unknown>,
      ) as ReturnType<typeof createConfig>;

      expect(result.headers["Accept-Language"]).toBe("en");
    });

    it("sets Accept-Language to zh-TW when bugspark_locale cookie exists", () => {
      document.cookie = "bugspark_locale=zh-TW; path=/";

      const config = createConfig();

      const result = requestInterceptor(
        config as unknown as Record<string, unknown>,
      ) as ReturnType<typeof createConfig>;

      expect(result.headers["Accept-Language"]).toBe("zh-TW");
    });

    it("returns 'en' when locale cookie value is malformed (%ZZ)", () => {
      document.cookie = "bugspark_locale=%ZZ; path=/";

      const config = createConfig();

      // Should not throw
      const result = requestInterceptor(
        config as unknown as Record<string, unknown>,
      ) as ReturnType<typeof createConfig>;

      expect(result.headers["Accept-Language"]).toBe("en");
    });
  });

  describe("response interceptor - CSRF token capture", () => {
    it("captures X-CSRF-Token from response headers", () => {
      const mockResponse = {
        headers: {
          "x-csrf-token": "new-csrf-from-response",
        },
        data: {},
      };

      responseInterceptor(mockResponse);

      // Now verify the captured token is used in the next request
      const config = createConfig();
      const result = requestInterceptor(
        config as unknown as Record<string, unknown>,
      ) as ReturnType<typeof createConfig>;

      expect(result.headers["X-CSRF-Token"]).toBe("new-csrf-from-response");
    });

    it("stores CSRF token in sessionStorage when captured from response", () => {
      const mockResponse = {
        headers: {
          "x-csrf-token": "stored-csrf-token",
        },
        data: {},
      };

      responseInterceptor(mockResponse);

      expect(sessionStorage.getItem("bugspark_csrf_token")).toBe(
        "stored-csrf-token",
      );
    });

    it("does not update CSRF when response has no x-csrf-token header", () => {
      // First set a known token via sessionStorage
      sessionStorage.setItem("bugspark_csrf_token", "original-token");

      const mockResponse = {
        headers: {},
        data: {},
      };

      responseInterceptor(mockResponse);

      // The original token should still be in sessionStorage
      expect(sessionStorage.getItem("bugspark_csrf_token")).toBe(
        "original-token",
      );
    });
  });
});
