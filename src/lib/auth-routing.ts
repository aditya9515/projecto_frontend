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
  const candidate = input.nextPath ?? "/account";
  // Accept only local paths; URL parsing also normalizes backslashes and controls.
  const origin = "https://projecto.local";
  let destination = new URL("/account", origin);
  if (candidate.startsWith("/") && !/[\\\u0000-\u0020]/.test(candidate)) {
    try {
      const parsed = new URL(candidate, origin);
      if (parsed.origin === origin && !["/login", "/desktop-login"].includes(parsed.pathname)) {
        destination = parsed;
      }
    } catch {
      // Keep the account destination for malformed return paths.
    }
  }

  if (input.intent === "checkout") {
    destination = new URL("/pricing", origin);
    destination.searchParams.set("billing", input.billingCycle);
    destination.searchParams.set("checkout", "1");
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}
