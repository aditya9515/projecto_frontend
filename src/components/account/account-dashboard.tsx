"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, LoaderCircle, LogOut, ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authorizedFetch } from "@/lib/client-api";
import type { AppSubscriptionSnapshot } from "@/lib/types";
import { formatDateOnly, initialsFromName } from "@/lib/utils";

interface SubscriptionStatusResponse extends AppSubscriptionSnapshot {
  email?: string;
  providerIds?: string[];
}

function statusLabel(status: SubscriptionStatusResponse["status"]) {
  switch (status) {
    case "active":
      return "Active";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
    default:
      return "Free";
  }
}

export function AccountDashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] =
    useState<SubscriptionStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/account");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        const response = await authorizedFetch(user, "/api/subscription/status");
        const payload = (await response.json()) as SubscriptionStatusResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load subscription state.");
        }

        if (active) {
          setSubscription(payload);
        }
      } catch (accountError) {
        if (active) {
          setError(
            accountError instanceof Error
              ? accountError.message
              : "Unable to load account state.",
          );
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  async function openBillingPortal() {
    if (!user) {
      return;
    }

    setBillingBusy(true);
    setError(null);

    try {
      const response = await authorizedFetch(user, "/api/billing/portal", {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Billing portal is not available yet.");
      }

      window.location.href = payload.url;
    } catch (billingError) {
      setBillingBusy(false);
      setError(
        billingError instanceof Error
          ? billingError.message
          : "Unable to open billing portal.",
      );
    }
  }

  if (loading || !user) {
    return (
      <div className="section-shell py-16 sm:py-20">
        <Card className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 text-muted-strong">
            <LoaderCircle className="size-5 animate-spin" />
            Loading your projecto account...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="section-shell py-16 sm:py-20">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.7fr)]">
        <Card className="reveal-1">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/5 text-lg font-semibold text-white">
                {initialsFromName(user.displayName, user.email)}
              </div>
              <div>
                <div className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-muted">
                  Account
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
                  {user.displayName ?? "projecto user"}
                </h1>
                <p className="mt-1 text-sm text-muted">{user.email}</p>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-strong">
              Providers:{" "}
              {user.providerData.map((provider) => provider.providerId).join(", ")}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/4 p-5">
              <div className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-muted">
                Current plan
              </div>
              <div className="mt-3 text-3xl font-semibold text-white">
                {subscription?.plan === "pro" ? "Pro" : "Free"}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/4 p-5">
              <div className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-muted">
                Subscription status
              </div>
              <div className="mt-3 text-3xl font-semibold text-white">
                {statusLabel(subscription?.status ?? "none")}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/4 p-5">
              <div className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-muted">
                Renewal date
              </div>
              <div className="mt-3 text-lg font-semibold text-white">
                {formatDateOnly(subscription?.expiresAt)}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/4 p-5">
              <div className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-muted">
                Access
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm font-semibold text-white">
                <ShieldCheck className="size-4" />
                {subscription?.status === "active" ? "Desktop verified" : "Free access"}
              </div>
            </div>
          </div>
        </Card>

        <Card className="reveal-2">
          <div className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-muted">
            Billing actions
          </div>
          <div className="mt-6 space-y-4">
            <Button
              className="w-full justify-between"
              disabled={billingBusy}
              onClick={() => void openBillingPortal()}
              type="button"
              variant="secondary"
            >
              <span className="inline-flex items-center gap-2">
                <CreditCard className="size-4" />
                Manage billing
              </span>
              {billingBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
            </Button>

            <Button
              className="w-full justify-between"
              onClick={() => void signOut()}
              type="button"
              variant="secondary"
            >
              <span className="inline-flex items-center gap-2">
                <LogOut className="size-4" />
                Log out
              </span>
            </Button>
          </div>
          <p className="mt-6 text-sm leading-7 text-muted">
            The projecto billing backend is the source of truth for your plan,
            renewal state, and secure desktop subscription checks.
          </p>
          {error ? <p className="mt-5 text-sm text-danger">{error}</p> : null}
        </Card>
      </div>
    </div>
  );
}
