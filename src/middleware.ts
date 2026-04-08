import { NextResponse } from "next/server";

import { applySecurityHeaders } from "@/lib/server/request-security";

export function middleware() {
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
