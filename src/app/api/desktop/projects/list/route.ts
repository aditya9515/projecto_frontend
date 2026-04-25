import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildDesktopCorsHeaders, desktopOptionsResponse, ensureDesktopOrigin } from "@/lib/cors";
import { getAppRuntimeEnv } from "@/lib/env";
import { requireDesktopSession, DesktopSessionError } from "@/lib/desktop-session";
import { listUserProjectDirectories } from "@/lib/project-directories";
import { desktopProjectSessionSchema } from "@/lib/project-directory-schemas";

export const runtime = "nodejs";

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
    const body = desktopProjectSessionSchema.parse(await request.json());
    const session = await requireDesktopSession(body);
    const result = await listUserProjectDirectories(session.userId);

    return NextResponse.json(result, {
      headers: buildDesktopCorsHeaders(allowedOrigin),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Origin not allowed") {
      return NextResponse.json(
        { error: "Origin not allowed" },
        { status: 403 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid desktop project list request.", details: error.flatten() },
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
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load desktop projects.",
      },
      { status: 500 },
    );
  }
}
