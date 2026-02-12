export type UserRole = "user" | "admin" | "superadmin";
export type UserPlan = "free" | "starter" | "team" | "enterprise";
export type BetaStatusType = "none" | "pending" | "approved" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  isActive: boolean;
  isEmailVerified?: boolean;
  betaStatus?: BetaStatusType;
  subscriptionStatus?: string | null;
  cancelAtPeriodEnd?: boolean;
  planExpiresAt?: string | null;
  createdAt: string;
  hasGoogleLinked?: boolean;
  hasPassword?: boolean;
}

export interface SubscriptionInfo {
  plan: string;
  status: string | null;
  currentPeriodEnd: string | null;
  planExpiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  billingInterval: string | null;
  amount: number | null;
}

export interface InvoiceInfo {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoicePdf: string | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  isActive: boolean;
  betaStatus: BetaStatusType;
  planExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  projectCount: number;
  reportCountMonth: number;
}

export interface BetaUser {
  id: string;
  name: string;
  email: string;
  betaStatus: BetaStatusType;
  betaReason: string | null;
  betaAppliedAt: string | null;
  createdAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalProjects: number;
  totalReports: number;
  usersByPlan: Record<string, number>;
  usersByRole: Record<string, number>;
  pendingBetaCount: number;
}

export interface Project {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  settings: Record<string, unknown>;
}

export interface BugReport {
  id: string;
  trackingId: string;
  projectId: string;
  title: string;
  description: string;
  severity: Severity;
  category: string;
  status: Status;
  screenshotUrl: string | null;
  annotatedScreenshotUrl: string | null;
  consoleLogs: ConsoleLogEntry[] | null;
  networkLogs: NetworkRequest[] | null;
  userActions: SessionEvent[] | null;
  metadata: Record<string, unknown> | null;
  assigneeId: string | null;
  reporterIdentifier: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsoleLogEntry {
  level: "log" | "info" | "warn" | "error" | "debug";
  message: string;
  stack?: string;
  timestamp: number;
}

export interface NetworkRequest {
  method: string;
  url: string;
  status: number;
  duration: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  timestamp: number;
}

export interface SessionEvent {
  type: string;
  target?: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  inp?: number;
}

export interface DeviceMetadata {
  userAgent: string;
  viewport: { width: number; height: number };
  screenResolution: { width: number; height: number };
  url: string;
  referrer: string;
  locale: string;
  timezone: string;
  connection?: string;
  memory?: number;
  platform: string;
  performance?: PerformanceMetrics;
}

export interface Comment {
  id: string;
  reportId: string;
  authorId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface Webhook {
  id: string;
  projectId: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export const WEBHOOK_EVENTS = ["report.created", "report.updated"] as const;

export interface OverviewStats {
  totalBugs: number;
  openBugs: number;
  resolvedToday: number;
  avgResolutionHours: number;
}

export interface ProjectStats {
  bugsBySeverity: Record<string, number>;
  bugsByStatus: Record<string, number>;
  bugsByDay: BugTrend[];
}

export interface BugTrend {
  date: string;
  count: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BugFilters {
  projectId?: string | null;
  search?: string;
  status?: Status[];
  severity?: Severity[];
  dateRange?: "7d" | "30d" | "90d" | "all";
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AnalysisResponse {
  summary: string;
  suggestedCategory: string;
  suggestedSeverity: string;
  reproductionSteps: string[];
  rootCause: string;
  fixSuggestions: string[];
  affectedArea: string;
}

export interface SimilarBug {
  id: string;
  trackingId: string;
  title: string;
  severity: Severity;
  status: Status;
  createdAt: string;
  similarityScore: number;
}

export interface SimilarBugsResponse {
  items: SimilarBug[];
}

export interface Integration {
  id: string;
  projectId: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  hasToken: boolean;
}

export interface ExportResult {
  issueUrl: string;
  issueNumber: number;
  issueIdentifier: string | null;
}

export type MemberRole = "viewer" | "editor" | "admin";

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string | null;
  email: string;
  role: MemberRole;
  inviteAcceptedAt: string | null;
  createdAt: string;
  displayName: string | null;
}

export type Severity = "critical" | "high" | "medium" | "low";
export type Status = "new" | "triaging" | "in_progress" | "resolved" | "closed";

export interface UsageQuota {
  current: number;
  limit: number | null;
}

export interface ProjectMemberUsage {
  projectId: string;
  projectName: string;
  memberCount: number;
  memberLimit: number | null;
}

export interface UsageResponse {
  projects: UsageQuota;
  reportsPerMonth: UsageQuota;
  teamMembersPerProject: ProjectMemberUsage[];
}
