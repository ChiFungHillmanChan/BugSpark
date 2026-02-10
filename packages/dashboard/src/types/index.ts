export type UserRole = "user" | "admin" | "superadmin";
export type UserPlan = "free" | "pro" | "enterprise";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalProjects: number;
  totalReports: number;
  usersByPlan: Record<string, number>;
  usersByRole: Record<string, number>;
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
  authorId: string;
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
}

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
}

export type Severity = "critical" | "high" | "medium" | "low";
export type Status = "new" | "triaging" | "in_progress" | "resolved" | "closed";
