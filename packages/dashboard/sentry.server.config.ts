import * as Sentry from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enableLogs: true,
  tracesSampleRate: isDev ? 1.0 : 0.2,
  environment: process.env.NODE_ENV,
});
