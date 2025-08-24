import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = process.env.COOKIE_NAME || "accessToken";
const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

function isTokenInvalidOrExpired(token: string): boolean {
  try {
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) return true;

    const normalized = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized));
    const exp = typeof json?.exp === "number" ? json.exp : null;

    if (!exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return exp <= now;
  } catch {
    return true;
  }
}

export function middleware(req: NextRequest) {
  const { nextUrl, url } = req;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const pathname = nextUrl.pathname;

  const isTryingToAccessDashboard = pathname.startsWith(DASHBOARD_PATH);
  const isTryingToAccessLogin = pathname === LOGIN_PATH;
  const isTokenInvalid = !token || isTokenInvalidOrExpired(token);

  if (isTryingToAccessDashboard && isTokenInvalid) {
    const loginUrl = new URL(LOGIN_PATH, url);
    loginUrl.searchParams.set("returnTo", pathname + nextUrl.search);

    const res = NextResponse.redirect(loginUrl);
    if (token) {
      res.cookies.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
    }
    return res;
  }

  if (!isTokenInvalid && isTryingToAccessLogin) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};