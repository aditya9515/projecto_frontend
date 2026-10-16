import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireVerifiedUser } from "@/lib/auth-server";
import { createDodoCheckoutSession } from "@/lib/dodo";
import { getAppRuntimeEnv } from "@/lib/env";
import { getUserProfile } from "@/lib/firestore";
import { getEffectiveSubscriptionAccess } from "@/lib/subscription-access";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";

const bodySchema = z.object({
  billingCycle: z.enum(["monthly", "yearly"]),
});

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const { billingCycle } = bodySchema.parse(await request.json());
    const subscription = await getEffectiveSubscriptionAccess(decoded.uid);
    if (subscription.plan === "pro" && subscription.status === "active") {
      return NextResponse.json({ error: "Your Pro access is already active. Manage your subscription from your account." }, { status: 409 });
    }
    const env = getAppRuntimeEnv();
    const profile = await getUserProfile(decoded.uid);
    const email = profile?.email ?? decoded.email;

    if (!email) {
      return NextResponse.json(
        { error: "Authenticated account is missing an email address." },
        { status: 400 },
      );
    }

    const checkout = await createDodoCheckoutSession({
      billingCycle,
      userId: decoded.uid,
      email,
      name:
        profile?.displayName ??
        decoded.name ??
        email.split("@")[0],
      returnUrl: absoluteUrl("/checkout/success", env.APP_BASE_URL),
      cancelUrl: absoluteUrl(`/pricing?billing=${billingCycle}`, env.APP_BASE_URL),
    });

    if (!checkout.checkout_url) {
      throw new Error("Dodo did not return a checkout URL.");
    }

    return NextResponse.json({
      checkoutUrl: checkout.checkout_url,
      sessionId: checkout.session_id,
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", undefined);
  }
}
