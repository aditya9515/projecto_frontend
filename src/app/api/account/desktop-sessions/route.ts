import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedUser } from "@/lib/auth-server";
import {
  listDesktopSessionsForUser,
  toPublicDesktopSession,
} from "@/lib/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireVerifiedUser(request);
    const sessions = await listDesktopSessionsForUser(user.uid);

    return NextResponse.json({
      sessions: sessions.map((session) => toPublicDesktopSession(session)),
    });
  } catch {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }
}
