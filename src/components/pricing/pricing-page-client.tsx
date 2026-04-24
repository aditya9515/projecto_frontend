"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, LoaderCircle, ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildCheckoutLoginHref, parseBillingCycle } from "@/lib/auth-routing";
import { authorizedFetch } from "@/lib/client-api";
import type { BillingCycle } from "@/lib/types";
import { cn } from "@/lib/utils";

const plans = {
  free: {
    name: "Free",
    price: "$0",
    cadence: "Forever",
    description: "A clean local-first setup for solo project launches.",
    features: [
      "5 projects",
      "2 launch profiles per project",
      "basic project detection",
      "local-only use",
    ],
  },
  pro: {
    name: "Pro",
    monthlyPrice: "$12",
    yearlyPrice: "$96",
    monthlyLabel: "per month",
    yearlyLabel: "per year",
    description:
      "Unlimited local project orchestration with premium launch power and billing-backed sync.",
    features: [
      "unlimited projects",
      "unlimited launch profiles",
      "advanced launch presets",
      "bulk project import",
      "premium themes",
      "future cloud sync support",
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

  const proPricing =
    billingCycle === "yearly"
      ? {
          price: plans.pro.yearlyPrice,
          cadence: plans.pro.yearlyLabel,
          badge: "Save 33%",
        }
      : {
          price: plans.pro.monthlyPrice,
          cadence: plans.pro.monthlyLabel,
          badge: "Monthly",
        };

  return (
    <div className="section-shell py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <div className="eyebrow justify-center">Pricing</div>
        <h1 className="mt-6 text-4xl font-semibold text-white sm:text-5xl">
          Billing-backed Pro access for the desktop app.
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-strong">
          LaunchStack uses this web app as the source of truth for users,
          subscriptions, and secure Pro verification.
        </p>
      </div>

      <div className="mt-10 flex justify-center">
        <div className="inline-flex rounded-full border border-white/10 bg-white/6 p-1">
          {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition",
                billingCycle === cycle
                  ? "bg-white text-slate-950"
                  : "text-muted-strong hover:text-white",
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
        <Card className="flex flex-col">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-muted">Free</div>
            <div className="mt-4 text-4xl font-semibold text-white">
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

        <Card className="relative overflow-hidden border-brand/20 bg-[linear-gradient(180deg,rgba(22,43,66,0.96),rgba(10,18,32,0.88))]">
          <div className="absolute right-6 top-6 rounded-full bg-brand/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            {proPricing.badge}
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-brand">
              Pro
            </div>
            <div className="mt-4 flex items-end gap-3">
              <div className="text-5xl font-semibold text-white">{proPricing.price}</div>
              <div className="pb-2 text-sm text-muted">{proPricing.cadence}</div>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-strong">
              {plans.pro.description}
            </p>
          </div>
          <ul className="mt-8 space-y-3 text-sm text-muted-strong">
            {plans.pro.features.map((feature) => (
              <li key={feature} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 space-y-4">
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
                "Sign in and upgrade"
              )}
            </Button>
            <div className="rounded-2xl border border-white/10 bg-white/4 p-4 text-sm text-muted">
              <div className="flex items-center gap-2 font-semibold text-white">
                <ShieldCheck className="size-4 text-emerald" />
                Secure billing flow
              </div>
              <p className="mt-2 leading-7">
                Google sign-in and Apple sign-in are used only for account and
                subscription sync. Payments and subscriptions are handled securely
                through Dodo Payments.
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
