import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";

import { buildDesktopCorsHeaders, desktopOptionsResponse, ensureDesktopOrigin } from "@/lib/cors";
import { getAppRuntimeEnv } from "@/lib/env";

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

    return NextResponse.json(
      {
        error:
          "License key activation is not enabled in projecto v1. Use account-backed subscription sync instead.",
      },
      {
        status: 501,
        headers: buildDesktopCorsHeaders(allowedOrigin),
      },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", buildDesktopCorsHeaders(allowedOrigin));
  }
}
