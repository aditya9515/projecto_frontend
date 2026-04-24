import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedUser } from "@/lib/auth-server";
import { createDodoCustomerPortal } from "@/lib/dodo";
import { getServerEnv } from "@/lib/env";
import { listSubscriptionsForUser } from "@/lib/firestore";
import { selectPrimarySubscription } from "@/lib/subscriptions";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const subscriptions = await listSubscriptionsForUser(decoded.uid);
    const primarySubscription = selectPrimarySubscription(subscriptions);

    if (!primarySubscription?.dodoCustomerId) {
      return NextResponse.json(
        { error: "No billable subscription was found for this account." },
        { status: 400 },
      );
    }

    const env = getServerEnv();
    const session = await createDodoCustomerPortal({
      customerId: primarySubscription.dodoCustomerId,
      returnUrl: absoluteUrl("/account", env.APP_BASE_URL),
    });

    return NextResponse.json({ url: session.link });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create billing portal session.",
      },
      { status: 500 },
    );
  }
}
