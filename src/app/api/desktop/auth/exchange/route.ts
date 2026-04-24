import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildDesktopCorsHeaders, desktopOptionsResponse, ensureDesktopOrigin } from "@/lib/cors";
import { getAppRuntimeEnv } from "@/lib/env";
import {
  consumeDesktopAuthToken,
  createDesktopSession,
  getDesktopAuthToken,
  getUserProfile,
  listSubscriptionsForUser,
} from "@/lib/firestore";
import { addDays, createOpaqueToken, isExpired, nowIso, sha256 } from "@/lib/security";
import { normalizeSubscription, selectPrimarySubscription, withPlanEntitlements } from "@/lib/subscriptions";

export const runtime = "nodejs";

const desktopBaseSchema = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().min(1),
  platform: z.enum(["windows", "macos", "linux"]),
});

const bodySchema = z.union([
  desktopBaseSchema.extend({
    token: z.string().min(1),
  }),
  desktopBaseSchema.extend({
    code: z.string().min(1),
    state: z.string().min(1),
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
  const env = getAppRuntimeEnv();

  try {
    const allowedOrigin = ensureDesktopOrigin(
      request,
      env.APP_BASE_URL,
      env.DESKTOP_ALLOWED_ORIGINS,
    );
    const body = bodySchema.parse(await request.json());
    const codeOrToken = "code" in body ? body.code : body.token;
    const tokenHash = sha256(codeOrToken);
    const existingTokenRecord = await getDesktopAuthToken(tokenHash);

    if (!existingTokenRecord) {
      return NextResponse.json(
        { error: "Desktop auth token is invalid or expired." },
        {
          status: 401,
          headers: buildDesktopCorsHeaders(allowedOrigin),
        },
      );
    }

    if (existingTokenRecord.stateHash) {
      if (!("state" in body) || sha256(body.state) !== existingTokenRecord.stateHash) {
        return NextResponse.json(
          { error: "Desktop auth state is invalid or expired." },
          {
            status: 401,
            headers: buildDesktopCorsHeaders(allowedOrigin),
          },
        );
      }
    }

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
    const subscription = withPlanEntitlements(
      normalizeSubscription(selectPrimarySubscription(subscriptions)),
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
          entitlements: subscription.entitlements,
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
