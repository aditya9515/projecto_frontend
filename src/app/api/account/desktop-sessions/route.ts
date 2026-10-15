import { apiErrorResponse } from "@/lib/api-errors";
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
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", undefined);
  }
}
