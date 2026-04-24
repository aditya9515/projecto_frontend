import type { Payment } from "dodopayments/resources/payments";
import type { Subscription } from "dodopayments/resources/subscriptions";

import { resolveBillingCycle, resolvePlanFromProduct } from "@/lib/subscriptions";
import type { SubscriptionRecord } from "@/lib/types";

export function buildSubscriptionRecord(input: {
  subscription: Subscription;
  monthlyProductId: string;
  yearlyProductId: string;
  existing: SubscriptionRecord | null;
}): SubscriptionRecord {
  const { subscription, monthlyProductId, yearlyProductId, existing } = input;
  const userId = existing?.userId ?? subscription.metadata.userId ?? "";

  if (!userId) {
    throw new Error("Unable to map Dodo subscription event to a projecto user.");
  }

  return {
    id: subscription.subscription_id,
    userId,
    email: subscription.customer.email,
    dodoCustomerId: subscription.customer.customer_id,
    dodoSubscriptionId: subscription.subscription_id,
    productId: subscription.product_id,
    plan: resolvePlanFromProduct(
      subscription.product_id,
      monthlyProductId,
      yearlyProductId,
    ),
    status: subscription.status,
    billingCycle: resolveBillingCycle(
      subscription.product_id,
      monthlyProductId,
      yearlyProductId,
    ),
    currentPeriodStart:
      subscription.previous_billing_date ?? existing?.currentPeriodStart ?? null,
    currentPeriodEnd:
      subscription.next_billing_date ?? existing?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd:
      subscription.cancel_at_next_billing_date ?? existing?.cancelAtPeriodEnd ?? false,
    createdAt: existing?.createdAt ?? subscription.created_at,
    updatedAt: new Date().toISOString(),
  };
}

export function applyPaymentEventToSubscription(
  existing: SubscriptionRecord | null,
  payment: Payment,
): SubscriptionRecord | null {
  if (!existing) {
    return null;
  }

  return {
    ...existing,
    email: payment.customer.email,
    dodoCustomerId: payment.customer.customer_id,
    status:
      payment.status === "failed"
        ? "failed"
        : existing.status,
    updatedAt: new Date().toISOString(),
  };
}
