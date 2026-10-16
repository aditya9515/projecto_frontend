import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildDesktopCorsHeaders, desktopOptionsResponse, ensureDesktopOrigin } from "@/lib/cors";
import { getAppRuntimeEnv } from "@/lib/env";
import { exchangeDesktopCallbackCode } from "@/lib/desktop-auth";

export const runtime = "nodejs";

const desktopBaseSchema = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().min(1).optional(),
  platform: z.enum(["windows", "macos", "linux"]),
});

const bodySchema = z.union([
  desktopBaseSchema.extend({
    token: z.string().min(1),
  }),
  desktopBaseSchema.extend({
    code: z.string().min(1),
    state: z.string().min(1),
    codeVerifier: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/).optional(),
  }),
]);

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
    const result = await exchangeDesktopCallbackCode({
      code: "code" in body ? body.code : body.token,
      state: "state" in body ? body.state : undefined,
      codeVerifier: "codeVerifier" in body ? body.codeVerifier : undefined,
      deviceId: body.deviceId,
      deviceName: body.deviceName,
      platform: body.platform,
    });

    return NextResponse.json(
      result,
      {
        headers: buildDesktopCorsHeaders(allowedOrigin),
      },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", buildDesktopCorsHeaders(allowedOrigin));
  }
}
