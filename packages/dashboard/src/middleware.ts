import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE_NAME, defaultLocale, locales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

const DASHBOARD_ROUTES = [
  "/dashboard",
  "/bugs",
  "/projects",
  "/settings",
  "/admin",
];

function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from dashboard routes.
  // In cross-origin deployments the HttpOnly auth cookies live on the API
  // domain, so middleware checks the dashboard-domain session indicator instead.
  if (isDashboardRoute(pathname)) {
    const hasSession = request.cookies.has("bugspark_session");
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const resolvedLocale =
    cookieLocale && locales.includes(cookieLocale as Locale)
      ? cookieLocale
      : defaultLocale;

  if (!cookieLocale || !locales.includes(cookieLocale as Locale)) {
    response.cookies.set(LOCALE_COOKIE_NAME, defaultLocale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }

  // SEO: signal content language to search engine crawlers
  response.headers.set("Content-Language", resolvedLocale);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
