import type {
  AppPlan,
  AppSubscriptionSnapshot,
  BillingCycle,
  SubscriptionRecord,
} from "@/lib/types";

const endOfTermStatuses = new Set(["cancelled", "failed", "on_hold"]);
const activeStatuses = new Set(["active", "pending"]);

function toTimestamp(value?: string | null) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function resolveBillingCycle(
  productId: string,
  monthlyProductId: string,
  yearlyProductId: string,
): BillingCycle {
  if (productId === yearlyProductId) {
    return "yearly";
  }

  if (productId === monthlyProductId) {
    return "monthly";
  }

  return "monthly";
}

export function resolvePlanFromProduct(
  productId: string,
  monthlyProductId: string,
  yearlyProductId: string,
): AppPlan {
  return productId === monthlyProductId || productId === yearlyProductId
    ? "pro"
    : "free";
}

export function selectPrimarySubscription(records: SubscriptionRecord[]) {
  if (records.length === 0) {
    return null;
  }

  return [...records].sort((left, right) => {
    const periodDiff =
      toTimestamp(right.currentPeriodEnd) - toTimestamp(left.currentPeriodEnd);

    if (periodDiff !== 0) {
      return periodDiff;
    }

    return toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt);
  })[0];
}

export function normalizeSubscription(
  subscription: SubscriptionRecord | null,
  reference = new Date(),
): AppSubscriptionSnapshot {
  if (!subscription) {
    return { plan: "free", status: "none" };
  }

  const currentPeriodEnd = subscription.currentPeriodEnd;
  const beforePeriodEnd =
    toTimestamp(currentPeriodEnd) > reference.getTime();

  if (activeStatuses.has(subscription.status)) {
    return {
      plan: subscription.plan,
      status: "active",
      rawStatus: subscription.status,
      expiresAt: currentPeriodEnd ?? undefined,
      currentPeriodEnd,
      currentPeriodStart: subscription.currentPeriodStart,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      billingCycle: subscription.billingCycle,
    };
  }

  if (endOfTermStatuses.has(subscription.status)) {
    return {
      plan: subscription.plan,
      status: beforePeriodEnd
        ? "active"
        : currentPeriodEnd
          ? "expired"
          : "cancelled",
      rawStatus: subscription.status,
      expiresAt: currentPeriodEnd ?? undefined,
      currentPeriodEnd,
      currentPeriodStart: subscription.currentPeriodStart,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      billingCycle: subscription.billingCycle,
    };
  }

  if (subscription.status === "expired") {
    return {
      plan: subscription.plan,
      status: "expired",
      rawStatus: subscription.status,
      expiresAt: currentPeriodEnd ?? undefined,
      currentPeriodEnd,
      currentPeriodStart: subscription.currentPeriodStart,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      billingCycle: subscription.billingCycle,
    };
  }

  return { plan: "free", status: "none" };
}

export function getPlanLabel(plan: AppPlan) {
  return plan === "pro" ? "Pro" : "Free";
}
