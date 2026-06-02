"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  LogOut,
  Monitor,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ContinueInDesktopButton } from "@/components/desktop/continue-in-desktop-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authorizedFetch } from "@/lib/client-api";
import type { AppSubscriptionSnapshot, DesktopSessionPublicRecord } from "@/lib/types";
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
  const [sessions, setSessions] = useState<DesktopSessionPublicRecord[]>([]);
  const [sessionBusyId, setSessionBusyId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        const response = await authorizedFetch(user, "/api/account/desktop-sessions");
        const payload = (await response.json()) as {
          sessions?: DesktopSessionPublicRecord[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load desktop devices.");
        }

        if (active) {
          setSessions(payload.sessions ?? []);
        }
      } catch (deviceError) {
        if (active) {
          setError(
            deviceError instanceof Error
              ? deviceError.message
              : "Unable to load desktop devices.",
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

  async function revokeDesktopSession(sessionId: string) {
    if (!user) {
      return;
    }

    setSessionBusyId(sessionId);
    setError(null);

    try {
      const response = await authorizedFetch(user, "/api/account/desktop-sessions/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });
      const payload = (await response.json()) as {
        session?: DesktopSessionPublicRecord;
        error?: string;
      };

      if (!response.ok || !payload.session) {
        throw new Error(payload.error ?? "Unable to revoke desktop session.");
      }

      setSessions((current) =>
        current.map((session) =>
          session.id === sessionId ? payload.session! : session,
        ),
      );
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Unable to revoke desktop session.",
      );
    } finally {
      setSessionBusyId(null);
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
                <div className="projecto-icon-surface flex size-16 items-center justify-center rounded-[1.5rem] border text-lg font-semibold">
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
                      : "border-amber bg-card-strong text-amber"
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

          <Card className="reveal-3">
            <div className="account-label">Desktop devices</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
              Signed-in Projecto desktop sessions
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              Revoke access for devices you no longer use. Revoked desktop apps
              must sign in again through the secure browser callback flow.
            </p>
            <div className="mt-6 space-y-3">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <div
                    className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card-strong p-4 sm:flex-row sm:items-center sm:justify-between"
                    key={session.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-foreground">
                        <Monitor className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {session.deviceName}
                        </div>
                        <div className="mt-1 text-xs text-muted">
                          {session.platform} · Last seen {formatDateOnly(session.lastSeenAt)}
                          {session.revoked ? " · Revoked" : ""}
                        </div>
                      </div>
                    </div>
                    <Button
                      disabled={session.revoked || sessionBusyId === session.id}
                      onClick={() => void revokeDesktopSession(session.id)}
                      type="button"
                      variant="secondary"
                    >
                      <Trash2 className="size-4" />
                      {session.revoked ? "Revoked" : "Revoke"}
                      {sessionBusyId === session.id ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : null}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-border px-5 py-6 text-sm text-muted">
                  No desktop sessions have been created yet.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
