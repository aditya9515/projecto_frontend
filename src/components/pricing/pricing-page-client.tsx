"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, LoaderCircle, ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ContinueInDesktopButton } from "@/components/desktop/continue-in-desktop-button";
import { RollingText } from "@/components/motion/rolling-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildCheckoutLoginHref, parseBillingCycle } from "@/lib/auth-routing";
import { authorizedFetch } from "@/lib/client-api";
import type { AppSubscriptionSnapshot, BillingCycle } from "@/lib/types";
import { cn } from "@/lib/utils";

const plans = {
  free: {
    name: "Free",
    price: "$0",
    cadence: "Forever",
    description: "A clean starting tier for developers who want fast local project launch control on a smaller workspace.",
    features: [
      "up to 5 project directories",
      "basic project detection",
      "1 project launch at a time",
      "bulk import locked",
      "standard launcher controls",
    ],
  },
  pro: {
    name: "Pro",
    monthlyPrice: "$8",
    yearlyPrice: "$80",
    monthlyLabel: "per month",
    yearlyLabel: "per year",
    description:
      "Unlimited workspace control with advanced detection, bulk import, and every new Pro update.",
    features: [
      "unlimited project directories",
      "unlimited active launches",
      "advanced project detection",
      "change project directories",
      "bulk import and bulk scan",
      "priority desktop updates",
      "all new Pro updates",
    ],
  },
};

export function PricingPageClient() {
  const { user, loading, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    parseBillingCycle(searchParams.get("billing")),
  );
  const [subscription, setSubscription] = useState<AppSubscriptionSnapshot | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoCheckoutStarted = useRef(false);

  const hasCheckoutIntent = searchParams.get("checkout") === "1";

  const startCheckout = useCallback(
    async (selectedCycle: BillingCycle) => {
      if (!user) {
        router.push(buildCheckoutLoginHref(selectedCycle));
        return;
      }

      setError(null);
      setIsSubmitting(true);

      try {
        const response = await authorizedFetch(user, "/api/checkout/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ billingCycle: selectedCycle }),
        });

        const payload = (await response.json()) as {
          error?: string;
          checkoutUrl?: string;
        };

        if (!response.ok || !payload.checkoutUrl) {
          throw new Error(payload.error ?? "Unable to start checkout.");
        }

        window.location.href = payload.checkoutUrl;
      } catch (checkoutError) {
        setError(
          checkoutError instanceof Error
            ? checkoutError.message
            : "Unable to start checkout.",
        );
        setIsSubmitting(false);
      }
    },
    [router, user],
  );

  useEffect(() => {
    if (
      !user ||
      loading ||
      !hasCheckoutIntent ||
      autoCheckoutStarted.current ||
      isSubmitting
    ) {
      return;
    }

    autoCheckoutStarted.current = true;
    void startCheckout(billingCycle);
  }, [billingCycle, hasCheckoutIntent, isSubmitting, loading, startCheckout, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        const response = await authorizedFetch(user, "/api/subscription/status");
        const payload = (await response.json()) as AppSubscriptionSnapshot & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load subscription state.");
        }

        if (active) {
          setSubscription(payload);
        }
      } catch {
        if (active) {
          setSubscription(null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const proPricing =
    billingCycle === "yearly"
      ? {
          price: plans.pro.yearlyPrice,
          cadence: plans.pro.yearlyLabel,
          badge: "2 months free",
        }
      : {
          price: plans.pro.monthlyPrice,
          cadence: plans.pro.monthlyLabel,
          badge: "Monthly",
        };
  const hasActiveDesktopAccess =
    user != null &&
    subscription?.plan === "pro" &&
    subscription.status === "active";
  const canContinueInDesktop = user != null && subscription != null;

  return (
    <div>
      <section className="dark-field noise-field border-b border-[#353532] pb-28 pt-16 sm:pb-36 sm:pt-24">
        <div className="section-shell">
          <div className="grid gap-9 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <div className="eyebrow" data-reveal>Pricing</div>
              <h1 className="mt-7 max-w-5xl text-5xl font-medium leading-[0.88] tracking-[-0.065em] sm:text-7xl lg:text-8xl" data-reveal>
                A smaller setup cost. A much faster start.
              </h1>
            </div>
            <div className="lg:pb-2" data-reveal>
              <p className="max-w-lg text-base leading-8 text-[#b8b8b2]">
                Projecto uses this site for sign-in, billing, and secure desktop
                verification. Your source code stays local.
              </p>
              <div className="mt-7 inline-flex rounded-[6px] border border-[#555550] bg-[#202020] p-1">
                {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
                  <button
                    aria-pressed={billingCycle === cycle}
                    className={cn(
                      "min-h-11 rounded-[3px] px-5 font-mono text-[0.68rem] font-medium uppercase tracking-[0.08em] transition",
                      billingCycle === cycle
                        ? "bg-brand text-foreground"
                        : "text-[#b8b8b2] hover:text-[#f1f1f1]",
                    )}
                    key={cycle}
                    onClick={() => setBillingCycle(cycle)}
                    type="button"
                  >
                    {cycle === "monthly" ? "Monthly" : "Yearly"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell relative -mt-20 pb-20 sm:-mt-24 sm:pb-28">
        <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
          <Card className="flex flex-col border-border-strong bg-card" data-reveal>
            <div className="flex items-start justify-between gap-6 border-b border-border-strong pb-7">
              <div>
                <div className="account-label"><span>01 / </span><span>Free</span></div>
                <div className="mt-7 text-7xl font-medium leading-none tracking-[-0.07em]">
                  {plans.free.price}
                </div>
                <div className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">
                  {plans.free.cadence}
                </div>
              </div>
              <span className="rounded-[4px] border border-border px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.08em]">
                Start here
              </span>
            </div>
            <p className="mt-7 max-w-lg text-sm leading-7 text-muted">{plans.free.description}</p>
            <ul className="mt-8 flex-1 border-t border-border">
              {plans.free.features.map((feature) => (
                <li className="flex gap-3 border-b border-border py-3 text-sm text-muted-strong" key={feature}>
                  <Check className="mt-0.5 size-4 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-8 w-full" href="/" variant="secondary">
              <RollingText>Start free</RollingText>
            </Button>
          </Card>

          <Card className="relative flex flex-col border-foreground bg-brand" data-reveal>
            <div className="flex items-start justify-between gap-6 border-b border-foreground pb-7">
              <div>
                <div className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.16em]"><span>02 / </span><span>Pro</span></div>
                <div className="mt-7 flex items-end gap-3">
                  <div className="text-7xl font-medium leading-none tracking-[-0.07em]">{proPricing.price}</div>
                  <div className="pb-2 font-mono text-[0.68rem] uppercase tracking-[0.08em]">{proPricing.cadence}</div>
                </div>
              </div>
              <span className="rounded-[4px] border border-foreground bg-foreground px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-[#f1f1f1]">
                {proPricing.badge}
              </span>
            </div>
            <p className="mt-7 max-w-lg text-sm leading-7">{plans.pro.description}</p>
            <ul className="mt-8 flex-1 border-t border-foreground">
              {plans.pro.features.map((feature) => (
                <li className="flex gap-3 border-b border-foreground py-3 text-sm" key={feature}>
                  <Check className="mt-0.5 size-4 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 space-y-3">
              {hasActiveDesktopAccess ? (
                <ContinueInDesktopButton className="w-full" label="Continue in Desktop App" subscription={subscription} user={user} />
              ) : (
                <>
                  <Button
                    className="w-full border-foreground bg-foreground text-[#f1f1f1] hover:border-foreground hover:bg-background hover:text-foreground"
                    disabled={isSubmitting || loading}
                    onClick={() => void startCheckout(billingCycle)}
                    type="button"
                  >
                    {isSubmitting ? (
                      <><LoaderCircle className="size-4 animate-spin" /> Opening secure checkout</>
                    ) : user ? (
                      "Upgrade to Pro"
                    ) : (
                      "Sign in before checkout"
                    )}
                  </Button>
                  {canContinueInDesktop ? (
                    <ContinueInDesktopButton className="w-full" label="Continue in Desktop App" requiresActiveSubscription={false} subscription={subscription} user={user} variant="secondary" />
                  ) : null}
                </>
              )}
            </div>
          </Card>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]" data-reveal>
          <div className="rounded-[8px] border border-border-strong bg-card p-6">
            <div className="flex items-center gap-2 font-mono text-[0.68rem] font-medium uppercase tracking-[0.1em]">
              <ShieldCheck className="size-4" /> Secure billing flow
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
              Google and Apple sign-in are used only for account and subscription
              sync. Payments are handled securely through Dodo Payments.
            </p>
          </div>
          <div className="rounded-[8px] border border-border bg-card-strong p-6 text-sm leading-7 text-muted">
            {!ready
              ? "Firebase client credentials are not configured yet, so checkout and sign-in are currently disabled."
              : "Your desktop app verifies access against this backend whenever it opens."}
            {error ? <p className="mt-3 text-danger">{error}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
