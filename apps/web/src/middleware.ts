
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = process.env.COOKIE_NAME || "accessToken";
const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

export function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const isAuthed = Boolean(token);

  const pathname = nextUrl.pathname;
  const goingToLogin = pathname === LOGIN_PATH;
  const goingToDashboard = pathname.startsWith(DASHBOARD_PATH);


  if (!isAuthed && goingToDashboard) {
    const url = new URL(LOGIN_PATH, req.url);
    url.searchParams.set("returnTo", pathname + nextUrl.search);
    return NextResponse.redirect(url);
  }


  if (isAuthed && goingToLogin) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, req.url));
  }

  return NextResponse.next();
}


export const config = {
  matcher: ["/login", '/dashboard'],
};
