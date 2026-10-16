import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildDesktopCorsHeaders, desktopOptionsResponse, ensureDesktopOrigin } from "@/lib/cors";
import { requireDesktopSession } from "@/lib/desktop-session";
import { getAppRuntimeEnv } from "@/lib/env";
import {
  listDesktopSessionsForUser,
  toPublicDesktopSession,
} from "@/lib/firestore";

export const runtime = "nodejs";

const bodySchema = z.object({
  desktopSessionToken: z.string().min(1),
  deviceId: z.string().min(1),
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
  let allowedOrigin: string | null = null;

  try {
    const env = getAppRuntimeEnv();
    allowedOrigin = ensureDesktopOrigin(
      request,
      env.APP_BASE_URL,
      env.DESKTOP_ALLOWED_ORIGINS,
    );
    const body = bodySchema.parse(await request.json());
    const currentSession = await requireDesktopSession(body);
    const sessions = await listDesktopSessionsForUser(currentSession.userId);

    return NextResponse.json(
      {
        sessions: sessions.map((session) =>
          toPublicDesktopSession(session, currentSession.id),
        ),
      },
      {
        headers: buildDesktopCorsHeaders(allowedOrigin),
      },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", buildDesktopCorsHeaders(allowedOrigin));
  }
}
