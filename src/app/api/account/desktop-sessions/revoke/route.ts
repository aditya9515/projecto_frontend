import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireVerifiedUser } from "@/lib/auth-server";
import {
  appendSubscriptionAuditLog,
  revokeDesktopSessionForUser,
  toPublicDesktopSession,
} from "@/lib/firestore";

export const runtime = "nodejs";

const bodySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser(request);
    const body = bodySchema.parse(await request.json());
    const session = await revokeDesktopSessionForUser(user.uid, body.sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Desktop session was not found." },
        { status: 404 },
      );
    }

    await appendSubscriptionAuditLog({
      userId: user.uid,
      type: "desktop_session_revoked",
      message: `Revoked desktop session for ${session.deviceName}.`,
      metadata: {
        sessionId: session.id,
        deviceId: session.deviceId,
        platform: session.platform,
      },
    });

    return NextResponse.json({
      session: toPublicDesktopSession(session),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid revoke request.", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }
}
