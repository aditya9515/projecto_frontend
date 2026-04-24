import DodoPayments from "dodopayments";
import type { UnwrapWebhookEvent } from "dodopayments/resources/webhooks";
import type { CheckoutSessionResponse } from "dodopayments/resources/checkout-sessions";

import { getDodoEnv } from "@/lib/env";
import type { BillingCycle } from "@/lib/types";

let cachedClient: DodoPayments | null = null;

function getDodoClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const env = getDodoEnv();
  cachedClient = new DodoPayments({
    bearerToken: env.DODO_API_KEY,
    webhookKey: env.DODO_WEBHOOK_SECRET,
    environment: env.DODO_ENVIRONMENT,
  });

  return cachedClient;
}

export function getProductIdForBillingCycle(billingCycle: BillingCycle) {
  const env = getDodoEnv();
  return billingCycle === "yearly"
    ? env.DODO_PRO_YEARLY_PRODUCT_ID
    : env.DODO_PRO_MONTHLY_PRODUCT_ID;
}

export async function createDodoCheckoutSession(input: {
  billingCycle: BillingCycle;
  userId: string;
  email: string;
  name: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<CheckoutSessionResponse> {
  const productId = getProductIdForBillingCycle(input.billingCycle);

  return getDodoClient().checkoutSessions.create({
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
      },
    ],
    customer: {
      email: input.email,
      name: input.name,
    },
    return_url: input.returnUrl,
    cancel_url: input.cancelUrl,
    customization: {
      theme: "dark",
    },
    metadata: {
      userId: input.userId,
      email: input.email,
      plan: "pro",
      billingCycle: input.billingCycle,
    },
    feature_flags: {
      allow_customer_editing_email: false,
      allow_customer_editing_name: true,
      redirect_immediately: false,
    },
  });
}

export async function createDodoCustomerPortal(input: {
  customerId: string;
  returnUrl: string;
}) {
  return getDodoClient().customers.customerPortal.create(input.customerId, {
    return_url: input.returnUrl,
    send_email: false,
  });
}

export function unwrapDodoWebhook(
  body: string,
  headers: Record<string, string>,
): UnwrapWebhookEvent {
  return getDodoClient().webhooks.unwrap(body, { headers });
}
