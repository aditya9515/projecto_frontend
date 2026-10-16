import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";

import { buildDesktopCorsHeaders, desktopOptionsResponse, ensureDesktopOrigin } from "@/lib/cors";
import { getAppRuntimeEnv } from "@/lib/env";
import { requireDesktopSession } from "@/lib/desktop-session";
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
  let allowedOrigin: string | null = null;

  try {
    const env = getAppRuntimeEnv();
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
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", buildDesktopCorsHeaders(allowedOrigin));
  }
}
