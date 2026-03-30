import { NextResponse } from "next/server";

import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import {
  registerMobilePushToken,
  unregisterMobilePushToken,
} from "@/lib/services/mobile-push-service";
import type { MobileDeviceTokenPlatform } from "@/lib/types";

function readPlatform(value: unknown): MobileDeviceTokenPlatform {
  switch (`${value ?? ""}`.trim().toLowerCase()) {
    case "android":
      return "android";
    case "ios":
      return "ios";
    case "web":
      return "web";
    default:
      return "unknown";
  }
}

function readToken(value: unknown) {
  return `${value ?? ""}`.trim();
}

export async function POST(request: Request) {
  const auth = await authenticateInteractiveRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const token = readToken(payload.token);

  if (!token) {
    return NextResponse.json(
      { error: "Missing push token." },
      { status: 400 }
    );
  }

  try {
    const result = await registerMobilePushToken({
      userId: auth.userId,
      email: auth.email,
      name: auth.profile.name,
      role: auth.profile.role,
      token,
      platform: readPlatform(payload.platform),
      deviceLabel: `${payload.deviceLabel ?? ""}`.trim() || undefined,
    });

    return NextResponse.json({
      ok: true,
      id: result.id,
      topic: result.topic,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Hindi mairehistro ang push notifications sa ngayon.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateInteractiveRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const token = readToken(payload.token);

  if (!token) {
    return NextResponse.json(
      { error: "Missing push token." },
      { status: 400 }
    );
  }

  try {
    const result = await unregisterMobilePushToken({
      userId: auth.userId,
      token,
    });

    return NextResponse.json({
      ok: true,
      removed: result.removed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Hindi matanggal ang push registration sa ngayon.",
      },
      { status: 500 }
    );
  }
}
