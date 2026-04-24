import { NextRequest, NextResponse } from "next/server";

import { buildDesktopCorsHeaders, desktopOptionsResponse, ensureDesktopOrigin } from "@/lib/cors";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";

export function OPTIONS(request: NextRequest) {
  const env = getServerEnv();
  return desktopOptionsResponse(
    request,
    env.APP_BASE_URL,
    env.DESKTOP_ALLOWED_ORIGINS,
  );
}

export async function POST(request: NextRequest) {
  const env = getServerEnv();

  try {
    const allowedOrigin = ensureDesktopOrigin(
      request,
      env.APP_BASE_URL,
      env.DESKTOP_ALLOWED_ORIGINS,
    );

    return NextResponse.json(
      {
        error:
          "License key activation is not enabled in LaunchStack v1. Use account-backed subscription sync instead.",
      },
      {
        status: 501,
        headers: buildDesktopCorsHeaders(allowedOrigin),
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Origin not allowed") {
      return NextResponse.json(
        { error: "Origin not allowed" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process license activation request.",
      },
      { status: 500 },
    );
  }
}
