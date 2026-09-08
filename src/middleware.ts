import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "math-club-session";

function getSecret() {
  const secret = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

async function getSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role as string;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = await getSession(request);

  if (pathname === "/login") {
    if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
    if (role === "parent") return NextResponse.redirect(new URL("/parent", request.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/parent")) {
    if (role !== "parent") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
    if (role === "parent") return NextResponse.redirect(new URL("/parent", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/parent/:path*"],
};
