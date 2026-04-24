import {
  FREE_DEFAULT_DIRECTORY_LIMIT,
  getPlanEntitlements,
  normalizeSubscription,
  selectPrimarySubscription,
  withPlanEntitlements,
} from "@/lib/subscriptions";
import type { SubscriptionRecord } from "@/lib/types";

const subscription = (overrides: Partial<SubscriptionRecord>): SubscriptionRecord => ({
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

describe("subscription helpers", () => {
  it("selects the most recent subscription snapshot", () => {
    const selected = selectPrimarySubscription([
      subscription({ id: "old", dodoSubscriptionId: "old", currentPeriodEnd: "2026-05-01T00:00:00.000Z" }),
      subscription({ id: "new", dodoSubscriptionId: "new", currentPeriodEnd: "2026-06-01T00:00:00.000Z" }),
    ]);

    expect(selected?.id).toBe("new");
  });

  it("marks active subscriptions as active", () => {
    expect(
      normalizeSubscription(
        subscription({ status: "active" }),
        new Date("2026-04-24T00:00:00.000Z"),
      ).status,
    ).toBe("active");
  });

  it("keeps cancelled subscriptions active until the period ends", () => {
    expect(
      normalizeSubscription(
        subscription({
          status: "cancelled",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: "2026-05-01T00:00:00.000Z",
        }),
        new Date("2026-04-24T00:00:00.000Z"),
      ).status,
    ).toBe("active");
  });

  it("marks cancelled subscriptions expired after the paid period", () => {
    expect(
      normalizeSubscription(
        subscription({
          status: "cancelled",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: "2026-04-01T00:00:00.000Z",
        }),
        new Date("2026-04-24T00:00:00.000Z"),
      ).status,
    ).toBe("expired");
  });

  it("limits free users to five default directories that cannot be changed", () => {
    expect(getPlanEntitlements({ plan: "free", status: "none" })).toEqual({
      defaultDirectoryLimit: FREE_DEFAULT_DIRECTORY_LIMIT,
      canChangeDefaultDirectories: false,
    });
  });

  it("gives active pro users unlimited default directories and change access", () => {
    expect(
      withPlanEntitlements(
        normalizeSubscription(
          subscription({ status: "active", plan: "pro" }),
          new Date("2026-04-24T00:00:00.000Z"),
        ),
      ).entitlements,
    ).toEqual({
      defaultDirectoryLimit: null,
      canChangeDefaultDirectories: true,
    });
  });
});
