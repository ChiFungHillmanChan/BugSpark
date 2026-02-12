/**
 * Dashboard-domain session indicator cookie.
 *
 * In cross-origin deployments (dashboard on Vercel, API on Render), the
 * HttpOnly auth cookies live under the API's domain and are invisible to
 * both `document.cookie` and Next.js middleware on the dashboard domain.
 *
 * This lightweight cookie (`bugspark_session=1`) is set on the dashboard
 * domain after a successful login so that:
 *   - Next.js middleware can gate dashboard routes
 *   - The AuthProvider can skip a `/auth/me` round-trip when not logged in
 *
 * It contains no sensitive data — actual authentication is still performed
 * by the HttpOnly cookies sent to the API.
 */

const SESSION_COOKIE = "bugspark_session";
const THIRTY_DAYS_SECONDS = 30 * 86400;

export function setSessionIndicator(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${THIRTY_DAYS_SECONDS}; SameSite=Lax`;
}

export function clearSessionIndicator(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function hasSessionIndicator(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${SESSION_COOKIE}=1`);
}
