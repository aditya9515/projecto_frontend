"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, LoaderCircle, ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ContinueInDesktopButton } from "@/components/desktop/continue-in-desktop-button";
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
      "basic themes",
    ],
  },
  pro: {
    name: "Pro",
    monthlyPrice: "$8",
    yearlyPrice: "$80",
    monthlyLabel: "per month",
    yearlyLabel: "per year",
    description:
      "Unlimited workspace control with advanced detection, bulk import, premium themes, and every new Pro update.",
    features: [
      "unlimited project directories",
      "unlimited active launches",
      "advanced project detection",
      "change project directories",
      "bulk import and bulk scan",
      "premium themes",
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
    <div className="section-shell py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <div className="eyebrow reveal-1 justify-center">Pricing</div>
        <h1 className="reveal-2 mt-6 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
          Pricing for a calmer way to open and run your dev projects.
        </h1>
        <p className="reveal-3 mt-5 text-lg leading-8 text-muted-strong">
          Projecto uses this web app for sign-in, billing, and secure desktop
          verification while your code stays local.
        </p>
      </div>

      <div className="mt-10 flex justify-center">
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition",
                billingCycle === cycle
                  ? "bg-foreground text-background"
                  : "text-muted-strong hover:text-foreground",
              )}
              onClick={() => setBillingCycle(cycle)}
              type="button"
            >
              {cycle === "monthly" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <Card className="reveal-1 flex flex-col">
          <div>
            <div className="account-label">
              Free
            </div>
            <div className="mt-4 text-4xl font-semibold text-foreground">
              {plans.free.price}
            </div>
            <div className="mt-1 text-sm text-muted">{plans.free.cadence}</div>
            <p className="mt-4 text-sm leading-7 text-muted">
              {plans.free.description}
            </p>
          </div>
          <ul className="mt-8 space-y-3 text-sm text-muted-strong">
            {plans.free.features.map((feature) => (
              <li key={feature} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Button className="mt-8" href="/" variant="secondary">
            Start Free
          </Button>
        </Card>

        <Card className="reveal-2 scan-line relative overflow-hidden bg-card-strong">
          <div className="absolute right-6 top-6 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
            {proPricing.badge}
          </div>
          <div>
            <div className="account-label">
              Pro
            </div>
            <div className="mt-4 flex items-end gap-3">
              <div className="text-5xl font-semibold text-foreground">{proPricing.price}</div>
              <div className="pb-2 text-sm text-muted">{proPricing.cadence}</div>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-strong">
              {plans.pro.description}
            </p>
          </div>
          <ul className="mt-8 space-y-3 text-sm text-muted-strong">
            {plans.pro.features.map((feature) => (
              <li key={feature} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 space-y-4">
            {hasActiveDesktopAccess ? (
              <ContinueInDesktopButton
                className="w-full"
                label="Continue in Desktop App"
                subscription={subscription}
                user={user}
              />
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  disabled={isSubmitting || loading}
                  onClick={() => void startCheckout(billingCycle)}
                  type="button"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Opening secure checkout
                    </>
                  ) : user ? (
                    "Upgrade to Pro"
                  ) : (
                    "Sign in before checkout"
                  )}
                </Button>
                {canContinueInDesktop ? (
                  <ContinueInDesktopButton
                    className="w-full"
                    label="Continue in Desktop App"
                    requiresActiveSubscription={false}
                    subscription={subscription}
                    user={user}
                    variant="secondary"
                  />
                ) : null}
              </div>
            )}
            <div className="rounded-[1.5rem] border border-border bg-card p-4 text-sm text-muted">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="size-4 text-foreground" />
                Secure billing flow
              </div>
              <p className="mt-2 leading-7">
                Google sign-in and Apple sign-in are used only for account and
                subscription sync. Payments are handled securely through Dodo
                Payments.
              </p>
            </div>
            {!ready ? (
              <p className="text-sm text-amber">
                Firebase client credentials are not configured yet, so checkout and
                sign-in are disabled until the environment variables are added.
              </p>
            ) : null}
            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
