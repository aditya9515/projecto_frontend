import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildDesktopCorsHeaders, desktopOptionsResponse, ensureDesktopOrigin } from "@/lib/cors";
import { getAppRuntimeEnv } from "@/lib/env";
import { requireDesktopSession, DesktopSessionError } from "@/lib/desktop-session";
import { deleteUserProjectDirectory, ProjectDirectoryError } from "@/lib/project-directories";
import { desktopProjectSessionSchema, projectDirectoryDeleteSchema } from "@/lib/project-directory-schemas";

export const runtime = "nodejs";

const bodySchema = desktopProjectSessionSchema.merge(projectDirectoryDeleteSchema);

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
    const session = await requireDesktopSession(body);
    const result = await deleteUserProjectDirectory(session.userId, body.projectId);

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
        { error: "Invalid desktop project delete request.", details: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof DesktopSessionError || error instanceof ProjectDirectoryError) {
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
            : "Unable to delete desktop project directory.",
      },
      { status: 500 },
    );
  }
}
