"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import { AppearanceSettings } from "@/components/account/appearance-settings";
import { useAuth } from "@/components/auth/auth-provider";
import { ContinueInDesktopButton } from "@/components/desktop/continue-in-desktop-button";
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

function providerLabel(providerId: string) {
  switch (providerId) {
    case "google.com":
      return "Google";
    case "apple.com":
      return "Apple";
    case "password":
      return "Email";
    default:
      return providerId;
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
            Loading your Projecto account...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="section-shell py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6 self-start lg:sticky lg:top-28">
          <Card className="reveal-1 overflow-hidden p-0">
            <div className="border-b border-border px-6 py-6">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-[1.5rem] border border-border bg-card-strong text-lg font-semibold text-foreground">
                  {initialsFromName(user.displayName, user.email)}
                </div>
                <div className="min-w-0">
                  <div className="account-label">Account</div>
                  <h1 className="mt-2 truncate text-3xl font-semibold tracking-[-0.03em] text-foreground">
                    {user.displayName ?? "Projecto user"}
                  </h1>
                  <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <div
                  className={`tone-chip ${
                    user.emailVerified
                      ? ""
                      : "border-amber/35 bg-amber/10 text-amber"
                  }`}
                >
                  <ShieldCheck className="size-3.5" />
                  {user.emailVerified ? "Verified email" : "Verification pending"}
                </div>
                <div className="tone-chip">
                  <CheckCircle2 className="size-3.5" />
                  {subscription?.status === "active" ? "Desktop verified" : "Free access"}
                </div>
              </div>
            </div>

            <div className="space-y-3 px-6 py-5">
              <div className="account-stat">
                <div className="account-label">Providers</div>
                <div className="account-value">
                  {user.providerData.length > 0
                    ? user.providerData
                        .map((provider) => providerLabel(provider.providerId))
                        .join(", ")
                    : "Not available"}
                </div>
              </div>
              <div className="account-stat">
                <div className="account-label">Current plan</div>
                <div className="account-value">
                  {subscription?.plan === "pro" ? "Pro" : "Free"}
                </div>
              </div>
              <div className="account-stat">
                <div className="account-label">Subscription status</div>
                <div className="account-value">
                  {statusLabel(subscription?.status ?? "none")}
                </div>
              </div>
              <div className="account-stat">
                <div className="account-label">Renewal date</div>
                <div className="account-value">
                  {formatDateOnly(subscription?.expiresAt)}
                </div>
              </div>
              <div className="account-stat">
                <div className="account-label">Desktop access</div>
                <div className="account-value">
                  {subscription?.status === "active"
                    ? "Verified for Pro desktop access"
                    : "Verified for Free desktop access"}
                </div>
              </div>
              <div className="account-stat">
                <div className="account-label">Hidden projects on Free</div>
                <div className="account-value">
                  {subscription?.archivedProjectCount ?? 0}
                </div>
              </div>
            </div>
          </Card>
        </aside>

        <div className="space-y-6">
          <Card className="reveal-2">
            <div className="account-label">Account tools</div>
            <div className="mt-4 max-w-2xl text-sm leading-7 text-muted">
              Projecto uses this account site as the source of truth for your
              plan, renewal state, hidden-project reconciliation, and secure
              desktop verification.
            </div>
            <div className="mt-6 space-y-4">
              <ContinueInDesktopButton
                className="w-full"
                requiresActiveSubscription={false}
                subscription={subscription}
                user={user}
                variant="secondary"
              />
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
            {error ? <p className="mt-5 text-sm text-danger">{error}</p> : null}
          </Card>

          <AppearanceSettings />
        </div>
      </div>
    </div>
  );
}
