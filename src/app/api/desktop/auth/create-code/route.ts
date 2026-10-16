import { z } from "zod";
import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedUser } from "@/lib/auth-server";
import { issueDesktopCallbackPayload } from "@/lib/desktop-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const text = await request.text();
    const binding = text ? z.object({
      state: z.string().regex(/^[A-Za-z0-9_-]{32}$/),
      codeChallenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    }).parse(JSON.parse(text)) : undefined;
    const payload = await issueDesktopCallbackPayload(decoded, binding);

    return NextResponse.json(payload);
  } catch (error) {
    return apiErrorResponse(error, "Unable to create desktop sign-in. Please try again.");
  }
}
