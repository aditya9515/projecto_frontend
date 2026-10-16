"use client";

import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";

import { Button } from "@/components/ui/button";
import type { AppSubscriptionSnapshot } from "@/lib/types";

function hasDesktopCallbackAccess(subscription: AppSubscriptionSnapshot | null) {
  return subscription?.plan === "pro" && subscription.status === "active";
}

export function ContinueInDesktopButton({
  user,
  subscription,
  autoStart = false,
  className,
  label = "Continue in Desktop App",
  variant = "primary",
  requiresActiveSubscription = true,
}: {
  user: User | null;
  subscription: AppSubscriptionSnapshot | null;
  autoStart?: boolean;
  className?: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  requiresActiveSubscription?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const autoStarted = useRef(false);
  const canOpenDesktopApp = user != null && (
    requiresActiveSubscription ? hasDesktopCallbackAccess(subscription) : true
  );

  const openDesktopApp = useCallback(async () => {
    if (!user || !canOpenDesktopApp) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setStarted(false);

    try {
      setStarted(true);
      // The desktop starts the challenge-bound login before this browser issues a code.
      window.location.href = "projecto://auth/start";
    } catch (desktopError) {
      setStarted(false);
      setError(
        desktopError instanceof Error
          ? desktopError.message
          : "Unable to continue in the desktop app.",
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [canOpenDesktopApp, user]);

  useEffect(() => {
    if (
      !autoStart ||
      autoStarted.current ||
      !user ||
      !canOpenDesktopApp
    ) {
      return;
    }

    autoStarted.current = true;
    void openDesktopApp();
  }, [autoStart, canOpenDesktopApp, openDesktopApp, user]);

  if (!user || !canOpenDesktopApp) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Button
        className={className}
        disabled={isLoading}
        onClick={() => void openDesktopApp()}
        type="button"
        variant={variant}
      >
        {isLoading ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Opening desktop app
          </>
        ) : (
          label
        )}
      </Button>
      {started ? (
        <p className="text-sm text-muted">
          If the desktop app did not open, try the button again.
        </p>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
