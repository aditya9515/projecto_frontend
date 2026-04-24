import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireVerifiedUser } from "@/lib/auth-server";
import { createDodoCheckoutSession } from "@/lib/dodo";
import { getAppRuntimeEnv } from "@/lib/env";
import { getUserProfile } from "@/lib/firestore";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";

const bodySchema = z.object({
  billingCycle: z.enum(["monthly", "yearly"]),
});

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const { billingCycle } = bodySchema.parse(await request.json());
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
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid checkout request.", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create checkout session.",
      },
      { status: 500 },
    );
  }
}
