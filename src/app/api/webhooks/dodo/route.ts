import { NextRequest, NextResponse } from "next/server";

import { applyPaymentEventToSubscription, buildSubscriptionRecord } from "@/lib/dodo-subscription";
import { getDodoEnv } from "@/lib/env";
import { getSubscriptionById, markWebhookProcessed, upsertSubscription } from "@/lib/firestore";
import { reconcileProjectDirectoryVisibilityForUser } from "@/lib/project-directories";
import { unwrapDodoWebhook } from "@/lib/dodo";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    const event = unwrapDodoWebhook(rawBody, headers);
    const env = getDodoEnv();
    const webhookId =
      request.headers.get("webhook-id") ??
      `${event.type}:${event.timestamp}`;

    switch (event.type) {
      case "subscription.active":
      case "subscription.cancelled":
      case "subscription.expired":
      case "subscription.failed":
      case "subscription.on_hold":
      case "subscription.plan_changed":
      case "subscription.renewed": {
        const existing = await getSubscriptionById(event.data.subscription_id);
        const record = buildSubscriptionRecord({
          subscription: event.data,
          monthlyProductId: env.DODO_PRO_MONTHLY_PRODUCT_ID,
          yearlyProductId: env.DODO_PRO_YEARLY_PRODUCT_ID,
          existing,
        });

        await upsertSubscription(record);
        await reconcileProjectDirectoryVisibilityForUser(record.userId);
        break;
      }

      case "payment.failed":
      case "payment.succeeded": {
        if (!event.data.subscription_id) {
          break;
        }

        const existing = await getSubscriptionById(event.data.subscription_id);
        const record = applyPaymentEventToSubscription(existing, event.data);

        if (record) {
          await upsertSubscription(record);
          await reconcileProjectDirectoryVisibilityForUser(record.userId);
        }
        break;
      }

      default:
        break;
    }

    const processed = await markWebhookProcessed(webhookId, event.type);
    return NextResponse.json({ received: true, duplicate: !processed });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process webhook.",
      },
      { status: 400 },
    );
  }
}
