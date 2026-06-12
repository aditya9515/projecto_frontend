import { NextRequest, NextResponse } from "next/server";

import {
  buildDesktopCorsHeaders,
  desktopOptionsResponse,
  ensureDesktopOrigin,
} from "@/lib/cors";
import { buildDesktopUpdateManifest } from "@/lib/desktop-update";
import { getOptionalAppConfig } from "@/lib/env";

export const runtime = "nodejs";

export function OPTIONS(request: NextRequest) {
  const env = getOptionalAppConfig();
  return desktopOptionsResponse(request, env.appBaseUrl);
}

export function GET(request: NextRequest) {
  const env = getOptionalAppConfig();

  try {
    const allowedOrigin = ensureDesktopOrigin(request, env.appBaseUrl);
    const { searchParams } = request.nextUrl;

    return NextResponse.json(
      buildDesktopUpdateManifest({
        currentVersion: searchParams.get("version") ?? undefined,
        platform: searchParams.get("platform") ?? undefined,
        arch: searchParams.get("arch") ?? undefined,
      }),
      {
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
            : "Unable to build desktop update manifest.",
      },
      { status: 500 },
    );
  }
}
