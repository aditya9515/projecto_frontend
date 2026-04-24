import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedUser } from "@/lib/auth-server";
import { getUserProfile, listSubscriptionsForUser } from "@/lib/firestore";
import { normalizeSubscription, selectPrimarySubscription, withPlanEntitlements } from "@/lib/subscriptions";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const [profile, subscriptions] = await Promise.all([
      getUserProfile(decoded.uid),
      listSubscriptionsForUser(decoded.uid),
    ]);

    const primarySubscription = selectPrimarySubscription(subscriptions);
    const summary = withPlanEntitlements(
      normalizeSubscription(primarySubscription),
    );

    return NextResponse.json({
      email: profile?.email ?? decoded.email ?? null,
      providerIds: profile?.providers ?? [decoded.firebase.sign_in_provider],
      ...summary,
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
