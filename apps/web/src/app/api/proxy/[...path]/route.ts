import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const FLASK_BASE_URL = process.env.FLASK_BASE_URL!;
const COOKIE_NAME = process.env.COOKIE_NAME || "accessToken";

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params);
}

async function forward(req: NextRequest, params: { path: string[] }) {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const pathname = `/${(params.path ?? []).join("/")}`;
  const url = `${FLASK_BASE_URL}${pathname}${req.nextUrl.search}`;

  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : req.body;

 
  const headers = new Headers(req.headers);
  headers.delete("host");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const resp = await fetch(url, { method, headers, body, redirect: "manual" });

  const res = new NextResponse(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
  });

  for (const h of ["content-type", "content-length", "etag", "cache-control", "last-modified"]) {
    const v = resp.headers.get(h);
    if (v) res.headers.set(h, v);
  }
  return res;
}
