import axios from "axios";

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
}

function getCsrfToken(): string | null {
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._isRetry) {
      originalRequest._isRetry = true;

      try {
        await axios.post(`${getApiBaseUrl()}/auth/refresh`, null, {
          withCredentials: true,
        });
        return apiClient(originalRequest);
      } catch {
        // AuthProvider and dashboard layout guard handle redirect to /login
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
