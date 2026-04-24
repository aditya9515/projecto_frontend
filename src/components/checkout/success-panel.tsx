"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authorizedFetch } from "@/lib/client-api";
import type { AppSubscriptionSnapshot } from "@/lib/types";
import { formatDateOnly } from "@/lib/utils";

export function SuccessPanel({ desktopProtocol }: { desktopProtocol: string }) {
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

        if (
          !cancelled &&
          payload.status !== "active" &&
          attempts < 6
        ) {
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
    <div className="section-shell py-16 sm:py-20">
      <Card className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald/16 text-emerald">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-white">
          Payment received. LaunchStack is updating your Pro access.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-strong">
          Payments and subscriptions are handled securely through Dodo Payments. This
          page waits for the billing webhook to sync your subscription state into the
          LaunchStack backend.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/4 p-6 text-left">
          {loading ? (
            <div className="inline-flex items-center gap-2 text-sm text-muted-strong">
              <LoaderCircle className="size-4 animate-spin" />
              Loading your account session…
            </div>
          ) : user ? (
            <div className="space-y-3 text-sm text-muted-strong">
              <div>Email: {user.email}</div>
              <div>Plan: {subscription?.plan === "pro" ? "Pro" : "Free"}</div>
              <div>Status: {subscription?.status ?? "waiting for webhook"}</div>
              <div>Renewal: {formatDateOnly(subscription?.expiresAt)}</div>
            </div>
          ) : (
            <div className="text-sm text-muted">
              Sign in again if you want this page to show your account-linked subscription
              state immediately.
            </div>
          )}
          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        </div>

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Button href={`${desktopProtocol}subscription/success`}>
            Open LaunchStack App
          </Button>
          <Button href="/account" variant="secondary">
            Go to account
          </Button>
        </div>
      </Card>
    </div>
  );
}
