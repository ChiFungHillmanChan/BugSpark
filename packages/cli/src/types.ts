export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
}

export interface CLIAuthResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  token: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  settings: Record<string, unknown>;
}

export interface WebhookResponse {
  id: string;
  projectId: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}
