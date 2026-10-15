"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ContinueInDesktopButton } from "@/components/desktop/continue-in-desktop-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthorizedResource } from "@/lib/use-authorized-resource";
import type { AppSubscriptionSnapshot } from "@/lib/types";
import { formatDateOnly } from "@/lib/utils";

export function SuccessPanel() {
  const { user, loading } = useAuth();
  const account = useAuthorizedResource<AppSubscriptionSnapshot>(user, "/api/subscription/status", "Unable to verify your subscription. Please try again.");
  const attempts = useRef(0);
  const subscription = account.data;
  const retry = account.retry;
  const confirmed = subscription?.plan === "pro" && subscription.status === "active";
  useEffect(() => { attempts.current = 0; }, [user]);
  useEffect(() => {
    if (!user || !subscription || confirmed || attempts.current >= 10) return;
    const timer = window.setTimeout(() => {
      attempts.current += 1;
      retry();
    }, 1800);
    return () => { window.clearTimeout(timer); };
  }, [retry, confirmed, subscription, user]);

  return (
    <div className="section-shell py-12 sm:py-20">
      <Card className="relative mx-auto max-w-5xl overflow-hidden border-border-strong p-0" data-reveal>
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-brand p-7 sm:p-10 lg:p-14">
            <div className="flex size-14 items-center justify-center rounded-[6px] border border-foreground bg-foreground text-brand">
              <CheckCircle2 className="size-7" />
            </div>
            <div className="mt-8 font-mono text-[0.68rem] uppercase tracking-[0.12em]">{confirmed ? "Access confirmed" : "Checking your subscription"}</div>
            <h1 className="mt-5 text-5xl font-medium leading-[0.92] tracking-[-0.06em] sm:text-6xl">
              {confirmed ? "Your Pro access is ready." : "Confirm your Pro access."}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8">
              {confirmed ? "Your account now has active Pro access. Continue in the desktop app or manage your account below." : "We are checking your account for the latest subscription update. Your Pro access appears here once checkout is confirmed."}
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
              <div className="flex justify-between gap-4 border-b border-border pb-3"><span className="text-muted">Plan</span><span className="font-medium">{subscription ? (subscription.plan === "pro" ? "Pro" : "Free") : "Checking..."}</span></div>
              <div className="flex justify-between gap-4 border-b border-border pb-3"><span className="text-muted">Status</span><span className="font-medium">{subscription?.status ?? "waiting"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted">Renewal</span><span className="font-medium">{formatDateOnly(subscription?.expiresAt)}</span></div>
            </div>
          ) : (
            <div className="text-sm text-muted">
              Sign in again if you want this page to show your account-linked
              subscription state immediately.
            </div>
          )}
          {account.error ? <p role="alert" className="mt-4 text-sm text-danger">{account.error}</p> : null}
          {user && !confirmed && !account.loading ? <p className="mt-4 text-sm text-muted">Pro access is not confirmed yet. If you completed checkout, refresh the status or check your account shortly.</p> : null}
          {user ? <Button className="mt-4" variant="secondary" disabled={account.loading} onClick={() => { attempts.current = 0; account.retry(); }}>Refresh subscription status</Button> : <Button href="/login?next=%2Fcheckout%2Fsuccess" className="mt-4">Sign in to check your subscription</Button>}
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
