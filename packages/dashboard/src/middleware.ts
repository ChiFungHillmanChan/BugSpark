import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE_NAME, defaultLocale, locales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (!cookieLocale || !locales.includes(cookieLocale as Locale)) {
    response.cookies.set(LOCALE_COOKIE_NAME, defaultLocale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }

  // Client-side auth check handles redirects via AuthProvider
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
