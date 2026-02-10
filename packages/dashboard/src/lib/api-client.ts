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
  // Fallback: read from same-origin cookie (works in local dev)
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    /(?:^|;\s*)bugspark_csrf_token=([^;]*)/,
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function getLocale(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)bugspark_locale=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "en";
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

apiClient.interceptors.response.use(
  (response) => {
    // Capture CSRF token from response headers (set by login/refresh endpoints)
    const newCsrfToken = response.headers["x-csrf-token"];
    if (newCsrfToken) {
      csrfTokenStore = newCsrfToken;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._isRetry) {
      originalRequest._isRetry = true;

      try {
        const refreshResponse = await axios.post(
          `${getApiBaseUrl()}/auth/refresh`,
          null,
          { withCredentials: true },
        );
        // Capture CSRF token from refresh response
        const newCsrfToken = refreshResponse.headers["x-csrf-token"];
        if (newCsrfToken) {
          csrfTokenStore = newCsrfToken;
        }
        return apiClient(originalRequest);
      } catch {
        // AuthProvider and dashboard layout guard handle redirect to /
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
