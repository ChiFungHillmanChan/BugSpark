export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
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

export interface ProjectWithSecret extends Project {
  apiSecret: string;
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
  search?: string;
  status?: Status[];
  severity?: Severity[];
  dateRange?: "7d" | "30d" | "90d" | "all";
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type Severity = "critical" | "high" | "medium" | "low";
export type Status = "new" | "triaging" | "in_progress" | "resolved" | "closed";
