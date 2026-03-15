import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "auth-token";

const ADMIN_ONLY_PAGES = ["/projects", "/employees", "/import"];
const ADMIN_ONLY_API_PREFIXES = ["/api/admin", "/api/import"];

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page, auth API, import-db (protected by its own secret), and static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/admin/import-db" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let payload: { role?: string } | null = null;
  try {
    const result = await jwtVerify(token, getSecret());
    payload = result.payload as { role?: string };
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = payload.role;
  const isAdmin = role === "ADMIN";

  // Admin-only pages
  if (ADMIN_ONLY_PAGES.some((p) => pathname.startsWith(p)) && !isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Admin-only API prefixes
  if (ADMIN_ONLY_API_PREFIXES.some((p) => pathname.startsWith(p)) && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Admin-only for write operations on employees, projects, phases
  const adminOnlyWriteApis = ["/api/employees", "/api/projects", "/api/phases"];
  const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  if (adminOnlyWriteApis.some((p) => pathname.startsWith(p)) && isWriteMethod && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo-white.png|.*\\.png$).*)"],
};
