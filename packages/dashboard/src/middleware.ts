import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE_NAME, defaultLocale, locales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

const DASHBOARD_ROUTES = [
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

  // Redirect unauthenticated users away from dashboard routes
  if (isDashboardRoute(pathname)) {
    const hasAccessToken = request.cookies.has("bugspark_access_token");
    if (!hasAccessToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (!cookieLocale || !locales.includes(cookieLocale as Locale)) {
    response.cookies.set(LOCALE_COOKIE_NAME, defaultLocale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
