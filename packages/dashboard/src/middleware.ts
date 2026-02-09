import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    pathname.startsWith(path),
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Client-side auth check handles redirects via AuthProvider
  // Middleware only ensures static/api paths are not intercepted
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
