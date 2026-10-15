import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedUser } from "@/lib/auth-server";
import { getUserProfile, listSubscriptionsForUser } from "@/lib/firestore";
import { selectPrimarySubscription } from "@/lib/subscriptions";
import { getProjectDirectoryAccess } from "@/lib/project-directories";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const [profile, access, subscriptions] = await Promise.all([
      getUserProfile(decoded.uid),
      getProjectDirectoryAccess(decoded.uid),
      listSubscriptionsForUser(decoded.uid),
    ]);

    return NextResponse.json({
      email: profile?.email ?? decoded.email ?? null,
      providerIds: profile?.providers ?? [decoded.firebase.sign_in_provider],
      ...access.subscription,
      entitlements: access.entitlements,
      archivedProjectCount: access.archivedProjectCount,
      canManageBilling: !!selectPrimarySubscription(subscriptions)?.dodoCustomerId,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", undefined);
  }
}
