import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildDesktopCorsHeaders, desktopOptionsResponse, ensureDesktopOrigin } from "@/lib/cors";
import { getAppRuntimeEnv } from "@/lib/env";
import { getDesktopSession, listSubscriptionsForUser, touchDesktopSession } from "@/lib/firestore";
import { isExpired, nowIso, sha256 } from "@/lib/security";
import { normalizeSubscription, selectPrimarySubscription, withPlanEntitlements } from "@/lib/subscriptions";

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
  const env = getAppRuntimeEnv();

  try {
    const allowedOrigin = ensureDesktopOrigin(
      request,
      env.APP_BASE_URL,
      env.DESKTOP_ALLOWED_ORIGINS,
    );
    const body = bodySchema.parse(await request.json());
    const sessionHash = sha256(body.desktopSessionToken);
    const session = await getDesktopSession(sessionHash);

    if (
      !session ||
      session.revoked ||
      isExpired(session.expiresAt) ||
      session.deviceId !== body.deviceId
    ) {
      return NextResponse.json(
        { error: "Desktop session is invalid or expired." },
        {
          status: 401,
          headers: buildDesktopCorsHeaders(allowedOrigin),
        },
      );
    }

    await touchDesktopSession(sessionHash);

    const subscription = normalizeSubscription(
      selectPrimarySubscription(
        await listSubscriptionsForUser(session.userId),
      ),
    );
    const subscriptionWithEntitlements = withPlanEntitlements(subscription);

    return NextResponse.json(
      {
        plan: subscriptionWithEntitlements.plan,
        status: subscriptionWithEntitlements.status,
        expiresAt: subscriptionWithEntitlements.expiresAt,
        entitlements: subscriptionWithEntitlements.entitlements,
        lastVerifiedAt: nowIso(),
      },
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid desktop verification request.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify desktop subscription.",
      },
      { status: 500 },
    );
  }
}
