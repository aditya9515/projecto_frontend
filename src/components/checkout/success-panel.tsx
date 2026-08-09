"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ContinueInDesktopButton } from "@/components/desktop/continue-in-desktop-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authorizedFetch } from "@/lib/client-api";
import type { AppSubscriptionSnapshot } from "@/lib/types";
import { formatDateOnly } from "@/lib/utils";

export function SuccessPanel() {
  const { user, loading } = useAuth();
  const [subscription, setSubscription] = useState<AppSubscriptionSnapshot | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;

      try {
        const response = await authorizedFetch(user, "/api/subscription/status");
        const payload = (await response.json()) as AppSubscriptionSnapshot & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load subscription state.");
        }

        if (!cancelled) {
          setSubscription(payload);
        }

        if (!cancelled && payload.status !== "active" && attempts < 6) {
          window.setTimeout(() => void poll(), 1800);
        }
      } catch (subscriptionError) {
        if (!cancelled) {
          setError(
            subscriptionError instanceof Error
              ? subscriptionError.message
              : "Unable to load subscription state.",
          );
        }
      }
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="section-shell py-12 sm:py-20">
      <Card className="relative mx-auto max-w-5xl overflow-hidden border-border-strong p-0" data-reveal>
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-brand p-7 sm:p-10 lg:p-14">
            <div className="flex size-14 items-center justify-center rounded-[6px] border border-foreground bg-foreground text-brand">
              <CheckCircle2 className="size-7" />
            </div>
            <div className="mt-8 font-mono text-[0.68rem] uppercase tracking-[0.12em]">Payment received</div>
            <h1 className="mt-5 text-5xl font-medium leading-[0.92] tracking-[-0.06em] sm:text-6xl">
              Projecto is updating your Pro access.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8">
              Dodo Payments securely handled checkout. This page now waits for the
              billing webhook to sync your subscription into the Projecto backend.
            </p>
          </div>

          <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-14">
            <div>
              <div className="account-label">Subscription status</div>
              <div className="mt-6 rounded-[6px] border border-border bg-background p-5 text-left">
          {loading ? (
            <div className="inline-flex items-center gap-2 text-sm text-muted-strong">
              <LoaderCircle className="size-4 animate-spin" />
              Loading your account session...
            </div>
          ) : user ? (
            <div className="space-y-3 text-sm text-muted-strong">
              <div className="flex justify-between gap-4 border-b border-border pb-3"><span className="text-muted">Email</span><span className="truncate font-medium">{user.email}</span></div>
              <div className="flex justify-between gap-4 border-b border-border pb-3"><span className="text-muted">Plan</span><span className="font-medium">{subscription?.plan === "pro" ? "Pro" : "Free"}</span></div>
              <div className="flex justify-between gap-4 border-b border-border pb-3"><span className="text-muted">Status</span><span className="font-medium">{subscription?.status ?? "waiting"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted">Renewal</span><span className="font-medium">{formatDateOnly(subscription?.expiresAt)}</span></div>
            </div>
          ) : (
            <div className="text-sm text-muted">
              Sign in again if you want this page to show your account-linked
              subscription state immediately.
            </div>
          )}
          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
              </div>
            </div>

            <div className="mt-8 grid gap-3">
              <ContinueInDesktopButton autoStart className="w-full" subscription={subscription} user={user} />
              <Button className="w-full" href="/account" variant="secondary">Go to account</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
