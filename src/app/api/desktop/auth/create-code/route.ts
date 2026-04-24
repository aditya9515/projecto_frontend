import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedUser } from "@/lib/auth-server";
import { issueDesktopCallbackPayload } from "@/lib/desktop-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const payload = await issueDesktopCallbackPayload(decoded);

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create desktop callback code.",
      },
      { status: 500 },
    );
  }
}
