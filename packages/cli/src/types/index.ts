export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
}

export interface QuotaUsage {
  current: number;
  limit: number | null;
}

export interface UserUsage {
  projects: QuotaUsage;
  reportsThisMonth: QuotaUsage;
}
