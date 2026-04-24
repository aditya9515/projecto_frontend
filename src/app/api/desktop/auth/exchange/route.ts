import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildDesktopCorsHeaders, desktopOptionsResponse, ensureDesktopOrigin } from "@/lib/cors";
import { getServerEnv } from "@/lib/env";
import {
  consumeDesktopAuthToken,
  createDesktopSession,
  getUserProfile,
  listSubscriptionsForUser,
} from "@/lib/firestore";
import { addDays, createOpaqueToken, isExpired, nowIso, sha256 } from "@/lib/security";
import { normalizeSubscription, selectPrimarySubscription } from "@/lib/subscriptions";

export const runtime = "nodejs";

const bodySchema = z.object({
  token: z.string().min(1),
  deviceId: z.string().min(1),
  deviceName: z.string().min(1),
  platform: z.enum(["windows", "macos", "linux"]),
});

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
    const body = bodySchema.parse(await request.json());
    const tokenHash = sha256(body.token);
    const tokenRecord = await consumeDesktopAuthToken(tokenHash);

    if (!tokenRecord || isExpired(tokenRecord.expiresAt)) {
      return NextResponse.json(
        { error: "Desktop auth token is invalid or expired." },
        {
          status: 401,
          headers: buildDesktopCorsHeaders(allowedOrigin),
        },
      );
    }

    const [profile, subscriptions] = await Promise.all([
      getUserProfile(tokenRecord.userId),
      listSubscriptionsForUser(tokenRecord.userId),
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: "User profile was not found." },
        {
          status: 404,
          headers: buildDesktopCorsHeaders(allowedOrigin),
        },
      );
    }

    const desktopSessionToken = createOpaqueToken();
    const desktopSessionHash = sha256(desktopSessionToken);
    const subscription = normalizeSubscription(
      selectPrimarySubscription(subscriptions),
    );
    const lastVerifiedAt = nowIso();

    await createDesktopSession({
      id: desktopSessionHash,
      userId: tokenRecord.userId,
      deviceId: body.deviceId,
      deviceName: body.deviceName,
      platform: body.platform,
      tokenHash: desktopSessionHash,
      createdAt: lastVerifiedAt,
      lastSeenAt: lastVerifiedAt,
      expiresAt: addDays(30),
      revoked: false,
    });

    return NextResponse.json(
      {
        desktopSessionToken,
        user: {
          email: profile.email,
          name: profile.displayName,
        },
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          expiresAt: subscription.expiresAt,
        },
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
        { error: "Invalid desktop auth exchange request.", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to exchange desktop auth token.",
      },
      { status: 500 },
    );
  }
}
