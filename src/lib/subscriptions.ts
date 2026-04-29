import type {
  AppPlan,
  AppSubscriptionSnapshot,
  BillingCycle,
  DesktopEntitlements,
  SubscriptionAccessStatus,
  SubscriptionOverrideRecord,
  SubscriptionRecord,
} from "@/lib/types";

const endOfTermStatuses = new Set(["cancelled", "failed", "on_hold"]);
const activeStatuses = new Set(["active", "pending"]);
export const FREE_DEFAULT_DIRECTORY_LIMIT = 5;
export const FREE_MAX_CONCURRENT_LAUNCHES = 1;

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

export function getPlanEntitlements(
  subscription: Pick<AppSubscriptionSnapshot, "plan" | "status">,
): DesktopEntitlements {
  const hasProAccess =
    subscription.plan === "pro" && subscription.status === "active";

  return {
    maxProjects: hasProAccess
      ? null
      : FREE_DEFAULT_DIRECTORY_LIMIT,
    canChangeProjectDirectories: true,
    maxConcurrentLaunches: hasProAccess
      ? null
      : FREE_MAX_CONCURRENT_LAUNCHES,
    canBulkImport: hasProAccess,
    canBulkScan: hasProAccess,
    canUseBasicThemes: true,
    canUsePremiumThemes: hasProAccess,
    projectStorage: "firestore",
    requiresOnline: true,
    projectDetectionLevel: hasProAccess ? "advanced" : "basic",
    defaultDirectoryLimit: hasProAccess
      ? null
      : FREE_DEFAULT_DIRECTORY_LIMIT,
    canChangeDefaultDirectories: true,
  };
}

export function withPlanEntitlements(
  subscription: AppSubscriptionSnapshot,
): AppSubscriptionSnapshot {
  return {
    ...subscription,
    entitlements: getPlanEntitlements(subscription),
  };
}

function normalizeOverrideStatus(
  override: SubscriptionOverrideRecord,
  reference = new Date(),
): SubscriptionAccessStatus {
  if (override.disabled) {
    return "none";
  }

  if (override.status !== "active") {
    return override.status;
  }

  if (!override.expiresAt) {
    return "active";
  }

  return toTimestamp(override.expiresAt) > reference.getTime()
    ? "active"
    : "expired";
}

export function normalizeSubscriptionOverride(
  override: SubscriptionOverrideRecord | null,
  reference = new Date(),
): AppSubscriptionSnapshot | null {
  if (!override) {
    return null;
  }

  const status = normalizeOverrideStatus(override, reference);

  if (status === "none") {
    return null;
  }

  return {
    plan: override.plan,
    status,
    expiresAt: override.expiresAt ?? undefined,
    billingCycle: override.billingCycle,
  };
}

export function resolveEffectiveSubscription(
  primarySubscription: SubscriptionRecord | null,
  override: SubscriptionOverrideRecord | null,
  reference = new Date(),
): AppSubscriptionSnapshot {
  const manualOverride = normalizeSubscriptionOverride(override, reference);

  if (manualOverride?.status === "active") {
    return withPlanEntitlements(manualOverride);
  }

  return withPlanEntitlements(
    normalizeSubscription(primarySubscription, reference),
  );
}

export function getPlanLabel(plan: AppPlan) {
  return plan === "pro" ? "Pro" : "Free";
}
