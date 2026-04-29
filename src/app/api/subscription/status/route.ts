import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedUser } from "@/lib/auth-server";
import { getUserProfile } from "@/lib/firestore";
import { getProjectDirectoryAccess } from "@/lib/project-directories";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const [profile, access] = await Promise.all([
      getUserProfile(decoded.uid),
      getProjectDirectoryAccess(decoded.uid),
    ]);

    return NextResponse.json({
      email: profile?.email ?? decoded.email ?? null,
      providerIds: profile?.providers ?? [decoded.firebase.sign_in_provider],
      ...access.subscription,
      entitlements: access.entitlements,
      archivedProjectCount: access.archivedProjectCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load subscription status.",
      },
      { status: 500 },
    );
  }
}
