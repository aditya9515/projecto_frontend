import { NextRequest } from "next/server";

import { unwrapDodoWebhook } from "@/lib/dodo";
import {
  getSubscriptionById,
  markWebhookProcessed,
  upsertSubscription,
} from "@/lib/firestore";
import { reconcileProjectDirectoryVisibilityForUser } from "@/lib/project-directories";
import type { SubscriptionRecord } from "@/lib/types";

import { POST } from "./route";

vi.mock("@/lib/dodo", () => ({
  unwrapDodoWebhook: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getDodoEnv: vi.fn(() => ({
    DODO_PRO_MONTHLY_PRODUCT_ID: "prod_monthly",
    DODO_PRO_YEARLY_PRODUCT_ID: "prod_yearly",
  })),
}));

vi.mock("@/lib/firestore", () => ({
  getSubscriptionById: vi.fn(),
  markWebhookProcessed: vi.fn(),
  upsertSubscription: vi.fn(),
}));

vi.mock("@/lib/project-directories", () => ({
  reconcileProjectDirectoryVisibilityForUser: vi.fn(),
}));

const existingSubscription: SubscriptionRecord = {
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
};

function request() {
  return new NextRequest("https://projecto.test/api/webhooks/dodo", {
    method: "POST",
    body: "{}",
    headers: {
      "webhook-id": "evt_1",
    },
  });
}

describe("Dodo webhook route", () => {
  beforeEach(() => {
    vi.mocked(getSubscriptionById).mockResolvedValue(existingSubscription);
    vi.mocked(markWebhookProcessed).mockResolvedValue(true);
    vi.mocked(upsertSubscription).mockResolvedValue(undefined);
    vi.mocked(reconcileProjectDirectoryVisibilityForUser).mockResolvedValue(
      {} as Awaited<ReturnType<typeof reconcileProjectDirectoryVisibilityForUser>>,
    );
  });

  it("processes subscription.updated as the source of truth for portal changes", async () => {
    vi.mocked(unwrapDodoWebhook).mockReturnValue({
      type: "subscription.updated",
      timestamp: "2026-06-12T00:00:00.000Z",
      data: {
        subscription_id: "sub_1",
        product_id: "prod_yearly",
        status: "active",
        previous_billing_date: "2026-06-01T00:00:00.000Z",
        next_billing_date: "2027-06-01T00:00:00.000Z",
        cancel_at_next_billing_date: true,
        created_at: "2026-04-01T00:00:00.000Z",
        metadata: {},
        customer: {
          customer_id: "cus_1",
          email: "user@example.com",
          name: "User",
        },
      },
    } as ReturnType<typeof unwrapDodoWebhook>);

    const response = await POST(request());

    await expect(response.json()).resolves.toEqual({
      received: true,
      duplicate: false,
    });
    expect(upsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        billingCycle: "yearly",
        cancelAtPeriodEnd: true,
        currentPeriodEnd: "2027-06-01T00:00:00.000Z",
      }),
    );
    expect(reconcileProjectDirectoryVisibilityForUser).toHaveBeenCalledWith(
      "user_1",
    );
  });

  it("processes dunning events for failed and recovered autopay attempts", async () => {
    vi.mocked(unwrapDodoWebhook).mockReturnValue({
      type: "dunning.started",
      timestamp: "2026-06-12T00:00:00.000Z",
      data: {
        created_at: "2026-06-12T00:00:00.000Z",
        customer_id: "cus_1",
        status: "recovering",
        subscription_id: "sub_1",
        trigger_state: "on_hold",
      },
    } as ReturnType<typeof unwrapDodoWebhook>);

    const response = await POST(request());

    await expect(response.json()).resolves.toEqual({
      received: true,
      duplicate: false,
    });
    expect(upsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        status: "on_hold",
        currentPeriodEnd: "2026-05-01T00:00:00.000Z",
      }),
    );
    expect(reconcileProjectDirectoryVisibilityForUser).toHaveBeenCalledWith(
      "user_1",
    );
  });
});
