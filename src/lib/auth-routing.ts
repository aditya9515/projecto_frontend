import type { BillingCycle } from "@/lib/types";

export function parseBillingCycle(value: string | null): BillingCycle {
  return value === "yearly" ? "yearly" : "monthly";
}

export function buildCheckoutLoginHref(billingCycle: BillingCycle) {
  const params = new URLSearchParams({
    next: "/pricing",
    intent: "checkout",
    billing: billingCycle,
  });

  return `/login?${params.toString()}`;
}

export function buildPostLoginDestination(input: {
  nextPath: string | null;
  intent: string | null;
  billingCycle: BillingCycle;
}) {
  const nextPath = input.nextPath ?? "/account";

  if (input.intent === "checkout") {
    const params = new URLSearchParams({
      billing: input.billingCycle,
      checkout: "1",
    });

    return `${nextPath}?${params.toString()}`;
  }

  return nextPath;
}
