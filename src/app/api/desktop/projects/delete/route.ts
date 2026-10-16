import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";

import { buildDesktopCorsHeaders, desktopOptionsResponse, ensureDesktopOrigin } from "@/lib/cors";
import { getAppRuntimeEnv } from "@/lib/env";
import { requireDesktopSession } from "@/lib/desktop-session";
import { deleteUserProjectDirectory } from "@/lib/project-directories";
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
  let allowedOrigin: string | null = null;

  try {
    const env = getAppRuntimeEnv();
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
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", buildDesktopCorsHeaders(allowedOrigin));
  }
}
