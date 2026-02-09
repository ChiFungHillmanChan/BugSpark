import apiClient from "./api-client";
import type { User } from "@/types";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export async function loginApi(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return response.data;
}

export async function registerApi(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
  });
  return response.data;
}

export async function refreshApi(
  refreshToken: string,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/refresh", {
    refreshToken,
  });
  return response.data;
}

export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<User>("/auth/me");
  return response.data;
}
