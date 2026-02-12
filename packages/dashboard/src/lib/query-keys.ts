import type { BugFilters } from "@/types";

export const queryKeys = {
  bugs: {
    all: ["bugs"] as const,
    list: (filters: BugFilters) => ["bugs", "list", filters] as const,
    detail: (id: string) => ["bugs", "detail", id] as const,
  },
  projects: {
    all: ["projects"] as const,
    manageable: ["projects", "manageable"] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
  },
  comments: {
    list: (reportId: string) => ["comments", reportId] as const,
  },
  similarBugs: {
    list: (reportId: string) => ["similarBugs", reportId] as const,
  },
  integrations: {
    list: (projectId: string) => ["integrations", projectId] as const,
  },
  webhooks: {
    list: (projectId: string) => ["webhooks", projectId] as const,
  },
  team: {
    members: (projectId: string) => ["team", "members", projectId] as const,
  },
  tokens: {
    all: ["tokens"] as const,
  },
  stats: {
    overview: ["stats", "overview"] as const,
    project: (id: string) => ["stats", "project", id] as const,
  },
  billing: {
    subscription: ["billing", "subscription"] as const,
    invoices: ["billing", "invoices"] as const,
  },
  admin: {
    users: <P extends object>(params?: P) =>
      ["admin", "users", params] as const,
    userDetail: (id: string) => ["admin", "users", id] as const,
    stats: ["admin", "stats"] as const,
    projects: ["admin", "projects"] as const,
    reports: ["admin", "reports"] as const,
    betaUsers: <P extends object>(params?: P) =>
      ["admin", "beta-users", params] as const,
    settings: ["admin", "settings"] as const,
  },
};
