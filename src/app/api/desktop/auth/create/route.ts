import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedUser } from "@/lib/auth-server";
import { issueDesktopAuthToken } from "@/lib/desktop-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const { token, expiresAt } = await issueDesktopAuthToken(decoded);

    return NextResponse.json({ token, expiresAt });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create desktop sign-in. Please try again.");
  }
}
