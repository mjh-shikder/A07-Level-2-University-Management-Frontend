import { NextResponse, type NextRequest } from "next/server";

type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT";

const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  ADMIN: "/admin",
  INSTRUCTOR: "/instructor",
  STUDENT: "/student",
};

const AUTH_ROUTES = new Set(["/login", "/register"]);

function decodeJwtRole(token: string | undefined): Role | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const json = atob(padded);
    const payload = JSON.parse(json) as { role?: unknown; exp?: unknown };

    if (
      payload.role === "ADMIN" ||
      payload.role === "INSTRUCTOR" ||
      payload.role === "STUDENT"
    ) {
      return payload.role;
    }
    return null;
  } catch {
    return null;
  }
}

function getRequiredRole(pathname: string): Role | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "ADMIN";
  }
  if (pathname === "/instructor" || pathname.startsWith("/instructor/")) {
    return "INSTRUCTOR";
  }
  if (pathname === "/student" || pathname.startsWith("/student/")) {
    return "STUDENT";
  }
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const role = decodeJwtRole(accessToken);
  const hasAnySessionCookie = Boolean(accessToken || refreshToken);

  // Redirect already-authenticated users away from login/register pages.
  if (AUTH_ROUTES.has(pathname) && role) {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARD_MAP[role], request.url)
    );
  }

  // Enforce role-based access on protected dashboard routes.
  const requiredRole = getRequiredRole(pathname);
  if (requiredRole) {
    if (!hasAnySessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    // If accessToken decoded to a different role, route to that role's dashboard.
    if (role && role !== requiredRole) {
      return NextResponse.redirect(
        new URL(ROLE_DASHBOARD_MAP[role], request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/backend|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
