import { NextResponse } from "next/server";

import { authenticateServerRequest } from "@/lib/server/request-auth";
import { withResolvedUserPermissions } from "@/lib/user-permissions";

export async function GET(request: Request) {
  const auth = await authenticateServerRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({
    profile: withResolvedUserPermissions(auth.profile),
    route: auth.profile.role === "developer" ? "/dashboard/developer" : undefined,
  });
}
