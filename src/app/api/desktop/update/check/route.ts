import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";

import {
  buildDesktopCorsHeaders,
  desktopOptionsResponse,
  ensureDesktopOrigin,
} from "@/lib/cors";
import { getLatestWindowsInstaller } from "@/lib/latest-release";
import { buildDesktopUpdateManifest } from "@/lib/desktop-update";
import { getAppRuntimeEnv } from "@/lib/env";

export const runtime = "nodejs";

export function OPTIONS(request: NextRequest) {
  const env = getAppRuntimeEnv();
  return desktopOptionsResponse(request, env.APP_BASE_URL, env.DESKTOP_ALLOWED_ORIGINS);
}

export async function GET(request: NextRequest) {
  let allowedOrigin: string | null = null;

  try {
    const env = getAppRuntimeEnv();
    allowedOrigin = ensureDesktopOrigin(request, env.APP_BASE_URL, env.DESKTOP_ALLOWED_ORIGINS);
    const { searchParams } = request.nextUrl;

    return NextResponse.json(
      buildDesktopUpdateManifest({
        installer: await getLatestWindowsInstaller(),
        currentVersion: searchParams.get("version") ?? undefined,
        platform: searchParams.get("platform") ?? undefined,
        arch: searchParams.get("arch") ?? undefined,
      }),
      {
        headers: buildDesktopCorsHeaders(allowedOrigin),
      },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", buildDesktopCorsHeaders(allowedOrigin));
  }
}
