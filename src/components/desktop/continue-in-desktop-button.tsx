"use client";

import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { authorizedFetch } from "@/lib/client-api";
import type { AppSubscriptionSnapshot, DesktopCallbackPayload } from "@/lib/types";

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
}: {
  user: User | null;
  subscription: AppSubscriptionSnapshot | null;
  autoStart?: boolean;
  className?: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const autoStarted = useRef(false);

  const openDesktopApp = useCallback(async () => {
    if (!user || !hasDesktopCallbackAccess(subscription)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setStarted(false);

    try {
      const response = await authorizedFetch(user, "/api/desktop/auth/create-code", {
        method: "POST",
      });
      const payload = (await response.json()) as Partial<DesktopCallbackPayload> & {
        error?: string;
      };

      if (!response.ok || !payload.redirectUrl || !payload.code || !payload.state) {
        throw new Error(
          payload.error ?? "Unable to create a desktop callback right now.",
        );
      }

      setStarted(true);
      window.location.href = payload.redirectUrl;
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
  }, [subscription, user]);

  useEffect(() => {
    if (
      !autoStart ||
      autoStarted.current ||
      !user ||
      !hasDesktopCallbackAccess(subscription)
    ) {
      return;
    }

    autoStarted.current = true;
    void openDesktopApp();
  }, [autoStart, openDesktopApp, subscription, user]);

  if (!user || !hasDesktopCallbackAccess(subscription)) {
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
