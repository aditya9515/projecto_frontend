import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildDesktopCorsHeaders, desktopOptionsResponse, ensureDesktopOrigin } from "@/lib/cors";
import { DesktopSessionError, requireDesktopSession } from "@/lib/desktop-session";
import { getAppRuntimeEnv } from "@/lib/env";
import {
  appendSubscriptionAuditLog,
  revokeDesktopSessionForUser,
  toPublicDesktopSession,
} from "@/lib/firestore";

export const runtime = "nodejs";

const bodySchema = z.object({
  desktopSessionToken: z.string().min(1),
  deviceId: z.string().min(1),
  sessionId: z.string().min(1),
});

export function OPTIONS(request: NextRequest) {
  const env = getAppRuntimeEnv();
  return desktopOptionsResponse(
    request,
    env.APP_BASE_URL,
    env.DESKTOP_ALLOWED_ORIGINS,
  );
}

export async function POST(request: NextRequest) {
  const env = getAppRuntimeEnv();
  let allowedOrigin: string | null = null;

  try {
    allowedOrigin = ensureDesktopOrigin(
      request,
      env.APP_BASE_URL,
      env.DESKTOP_ALLOWED_ORIGINS,
    );
    const body = bodySchema.parse(await request.json());
    const currentSession = await requireDesktopSession(body);
    const session = await revokeDesktopSessionForUser(
      currentSession.userId,
      body.sessionId,
    );

    if (!session) {
      return NextResponse.json(
        { error: "Desktop session was not found." },
        {
          status: 404,
          headers: buildDesktopCorsHeaders(allowedOrigin),
        },
      );
    }

    await appendSubscriptionAuditLog({
      userId: currentSession.userId,
      type: "desktop_session_revoked",
      message: `Revoked desktop session for ${session.deviceName}.`,
      metadata: {
        sessionId: session.id,
        deviceId: session.deviceId,
        platform: session.platform,
      },
    });

    return NextResponse.json(
      { session: toPublicDesktopSession(session, currentSession.id) },
      {
        headers: buildDesktopCorsHeaders(allowedOrigin),
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Origin not allowed") {
      return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid desktop session revoke request.", details: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof DesktopSessionError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        {
          status: error.status,
          headers: buildDesktopCorsHeaders(allowedOrigin),
        },
      );
    }

    return NextResponse.json(
      { error: "Unable to revoke desktop session." },
      { status: 500 },
    );
  }
}
