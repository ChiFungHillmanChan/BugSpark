import axios from "axios";

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
}

const apiClient = axios.create({
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._isRetry) {
      originalRequest._isRetry = true;

      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("bugspark_refresh_token")
          : null;

      if (refreshToken) {
        try {
          const response = await axios.post(
            `${getApiBaseUrl()}/auth/refresh`,
            { refreshToken },
          );
          const newAccessToken = response.data.accessToken as string;
          setAccessToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch {
          setAccessToken(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("bugspark_refresh_token");
            window.location.href = "/login";
          }
        }
      } else if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
