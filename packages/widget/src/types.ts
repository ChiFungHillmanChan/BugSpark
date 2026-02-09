export interface BugSparkConfig {
  apiKey: string;
  endpoint: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  beforeSend?: (report: BugReport) => BugReport | null;
  onSubmit?: (report: BugReport) => void;
  user?: BugSparkUser;
  enableScreenshot: boolean;
  enableConsoleLogs: boolean;
  enableNetworkLogs: boolean;
  enableSessionRecording: boolean;
}

export interface BugSparkUser {
  id?: string;
  email?: string;
  name?: string;
}

export interface BugReport {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'bug' | 'ui' | 'performance' | 'crash' | 'other';
  screenshot?: Blob;
  annotatedScreenshot?: Blob;
  consoleLogs: ConsoleLogEntry[];
  networkLogs: NetworkLogEntry[];
  userActions: SessionEvent[];
  metadata: DeviceMetadata;
  reporterIdentifier?: string;
}

export interface ConsoleLogEntry {
  level: string;
  message: string;
  timestamp: number;
  stack?: string;
}

export interface NetworkLogEntry {
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

export type AnnotationToolType =
  | 'pen'
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'blur'
  | 'none';

export interface AnnotationShape {
  type: AnnotationToolType;
  color: string;
  lineWidth: number;
  points?: Array<{ x: number; y: number }>;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  text?: string;
  radius?: number;
}
