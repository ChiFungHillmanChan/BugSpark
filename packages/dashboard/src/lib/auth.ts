import apiClient from "./api-client";
import { BUGSPARK_API_URL } from "./constants";
import type { User } from "@/types";

export interface BetaRegisterResult {
  message: string;
  betaStatus: string;
}

export type RegisterResult =
  | { kind: "user"; user: User }
  | { kind: "beta"; result: BetaRegisterResult };

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
): Promise<RegisterResult> {
  const response = await apiClient.post<User | BetaRegisterResult>("/auth/register", {
    name,
    email,
    password,
  });

  const data = response.data;

  // If the API returned a beta response (user placed on waiting list)
  if ("betaStatus" in data && (data as BetaRegisterResult).betaStatus === "pending") {
    return { kind: "beta", result: data as BetaRegisterResult };
  }

  return { kind: "user", user: data as User };
}

export async function logoutApi(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<User>("/auth/me");
  return response.data;
}

export async function checkBetaMode(): Promise<boolean> {
  const response = await apiClient.get<{ betaModeEnabled: boolean }>("/auth/beta-mode");
  return response.data.betaModeEnabled;
}

export function getGoogleLoginUrl(redirect?: string, mode: "login" | "link" = "login"): string {
  const baseUrl = BUGSPARK_API_URL.replace("/api/v1", "");
  const params = new URLSearchParams();
  if (redirect) params.set("redirect", redirect);
  params.set("mode", mode);
  return `${baseUrl}/api/v1/auth/google/login?${params.toString()}`;
}

export async function getGoogleAuthStatus(): Promise<boolean> {
  try {
    const response = await apiClient.get<{ enabled: boolean }>("/auth/google/status");
    return response.data.enabled;
  } catch {
    return false;
  }
}

export async function unlinkGoogleAccount(): Promise<void> {
  await apiClient.delete("/auth/google/link");
}
