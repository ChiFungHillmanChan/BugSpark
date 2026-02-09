import apiClient from "./api-client";
import type { User } from "@/types";

export async function loginApi(
  email: string,
  password: string,
): Promise<User> {
  const response = await apiClient.post<User>("/auth/login", {
    email,
    password,
  });
  return response.data;
}

export async function registerApi(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const response = await apiClient.post<User>("/auth/register", {
    name,
    email,
    password,
  });
  return response.data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<User>("/auth/me");
  return response.data;
}
