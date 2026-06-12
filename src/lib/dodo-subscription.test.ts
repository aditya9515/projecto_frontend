import type { Payment } from "dodopayments/resources/payments";
import type { Subscription } from "dodopayments/resources/subscriptions";

import {
  applyDunningEventToSubscription,
  applyPaymentEventToSubscription,
  buildSubscriptionRecord,
} from "@/lib/dodo-subscription";
import type { SubscriptionRecord } from "@/lib/types";

const existingSubscription = (
  overrides: Partial<SubscriptionRecord> = {},
): SubscriptionRecord => ({
  id: "sub_1",
  userId: "user_1",
  email: "user@example.com",
  dodoCustomerId: "cus_1",
  dodoSubscriptionId: "sub_1",
  productId: "prod_monthly",
  plan: "pro",
  status: "active",
  billingCycle: "monthly",
  currentPeriodStart: "2026-04-01T00:00:00.000Z",
  currentPeriodEnd: "2026-05-01T00:00:00.000Z",
  cancelAtPeriodEnd: false,
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-10T00:00:00.000Z",
  ...overrides,
});

const subscriptionEvent = (
  overrides: Partial<Subscription> = {},
): Subscription =>
  ({
    subscription_id: "sub_1",
    product_id: "prod_monthly",
    status: "active",
    previous_billing_date: "2026-05-01T00:00:00.000Z",
    next_billing_date: "2026-06-01T00:00:00.000Z",
    cancel_at_next_billing_date: false,
    created_at: "2026-04-01T00:00:00.000Z",
    metadata: {
      userId: "user_1",
    },
    customer: {
      customer_id: "cus_1",
      email: "user@example.com",
      name: "User",
    },
    ...overrides,
  }) as Subscription;

const paymentEvent = (overrides: Partial<Payment> = {}): Payment =>
  ({
    payment_id: "pay_1",
    status: "failed",
    subscription_id: "sub_1",
    customer: {
      customer_id: "cus_1",
      email: "user@example.com",
      name: "User",
    },
    metadata: {},
    ...overrides,
  }) as Payment;

describe("Dodo subscription mapping", () => {
  it("maps subscription renewal and update events into the stored record", () => {
    const result = buildSubscriptionRecord({
      subscription: subscriptionEvent({
        next_billing_date: "2026-07-01T00:00:00.000Z",
      }),
      monthlyProductId: "prod_monthly",
      yearlyProductId: "prod_yearly",
      existing: existingSubscription(),
    });

    expect(result).toMatchObject({
      userId: "user_1",
      dodoCustomerId: "cus_1",
      dodoSubscriptionId: "sub_1",
      plan: "pro",
      status: "active",
      billingCycle: "monthly",
      currentPeriodEnd: "2026-07-01T00:00:00.000Z",
    });
  });

  it("preserves an existing user mapping when Dodo omits metadata", () => {
    const result = buildSubscriptionRecord({
      subscription: subscriptionEvent({ metadata: {} }),
      monthlyProductId: "prod_monthly",
      yearlyProductId: "prod_yearly",
      existing: existingSubscription({ userId: "mapped_user" }),
    });

    expect(result.userId).toBe("mapped_user");
  });

  it("marks a stored subscription failed after a failed payment event", () => {
    const result = applyPaymentEventToSubscription(
      existingSubscription(),
      paymentEvent(),
    );

    expect(result?.status).toBe("failed");
  });

  it("marks dunning start and recovery events without losing period data", () => {
    const onHold = applyDunningEventToSubscription(existingSubscription(), {
      status: "recovering",
      trigger_state: "on_hold",
    });
    const recovered = applyDunningEventToSubscription(onHold, {
      status: "recovered",
      trigger_state: "on_hold",
    });

    expect(onHold?.status).toBe("on_hold");
    expect(recovered).toMatchObject({
      status: "active",
      currentPeriodEnd: "2026-05-01T00:00:00.000Z",
    });
  });
});
