import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = process.env.COOKIE_NAME || "accessToken";
const PUBLIC_PATHS = ["/login"];
const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

function isTokenInvalidOrExpired(token: string): boolean {
  try {
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) return true;

    const normalized = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = atob(normalized);
    const payload = JSON.parse(payloadJson);

    const exp = typeof payload?.exp === "number" ? payload.exp : null;
    if (!exp) return true;

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return exp <= nowInSeconds;
  } catch {
    return true;
  }
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  const isTokenValid = token && !isTokenInvalidOrExpired(token);
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (isTokenValid && isPublicPath) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_PATH, req.url));
  }

  if (!isTokenValid && !isPublicPath) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("returnTo", `${pathname}${search}`);
    }

    const response = NextResponse.redirect(loginUrl);

    if (token) {
      response.cookies.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/event/:path*",
  ],
};