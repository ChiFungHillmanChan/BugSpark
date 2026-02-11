import axios from "axios";

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
}

// In cross-origin setups (dashboard on Vercel, API on Render), document.cookie
// only exposes cookies from the *dashboard's* domain — not the API's domain.
// So we store the CSRF token in memory, populated from the X-CSRF-Token response
// header that the API sends on login/refresh.
let csrfTokenStore: string | null = null;

function getCsrfToken(): string | null {
  if (csrfTokenStore) return csrfTokenStore;
  // Fallback: read from sessionStorage (survives page refresh in cross-origin setup)
  try {
    const stored = typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("bugspark_csrf_token")
      : null;
    if (stored) {
      csrfTokenStore = stored;
      return stored;
    }
  } catch {
    // SSR or restricted storage — ignore
  }
  // Fallback: read from same-origin cookie (works in local dev)
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    /(?:^|;\s*)bugspark_csrf_token=([^;]*)/,
  );
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function getLocale(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)bugspark_locale=([^;]*)/);
  if (!match) return "en";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "en";
  }
}

const apiClient = axios.create({
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  config.headers["Accept-Language"] = getLocale();

  return config;
});

let refreshPromise: Promise<void> | null = null;

apiClient.interceptors.response.use(
  (response) => {
    // Capture CSRF token from response headers (set by login/refresh endpoints)
    const newCsrfToken = response.headers["x-csrf-token"];
    if (newCsrfToken) {
      csrfTokenStore = newCsrfToken;
      try {
        sessionStorage.setItem("bugspark_csrf_token", newCsrfToken);
      } catch {
        // SSR or restricted storage — ignore
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._isRetry) {
      originalRequest._isRetry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${getApiBaseUrl()}/auth/refresh`, null, {
              withCredentials: true,
            })
            .then((refreshResponse) => {
              const newCsrfToken = refreshResponse.headers["x-csrf-token"];
              if (newCsrfToken) {
                csrfTokenStore = newCsrfToken;
                try {
                  sessionStorage.setItem("bugspark_csrf_token", newCsrfToken);
                } catch {
                  // SSR or restricted storage — ignore
                }
              }
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        await refreshPromise;
        return apiClient(originalRequest);
      } catch {
        // AuthProvider and dashboard layout guard handle redirect to /
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
