"use client";

import {
  Apple,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchSignInMethodsForEmail,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type AuthError,
  type User,
} from "firebase/auth";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildPostLoginDestination, parseBillingCycle } from "@/lib/auth-routing";
import { authorizedFetch } from "@/lib/client-api";
import { getFirebaseAuthClient } from "@/lib/firebase/client";
import { syncFirebaseUser } from "@/lib/firebase/sync";
import { describeProviderConflict } from "@/lib/provider-conflict";
import type { BillingCycle, DesktopCallbackPayload } from "@/lib/types";

function createProvider(kind: "google" | "apple") {
  if (kind === "google") {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return provider;
  }

  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return provider;
}

function shouldFallbackToRedirect(error: AuthError) {
  return (
    error.code === "auth/popup-blocked" ||
    error.code === "auth/operation-not-supported-in-this-environment"
  );
}

async function describeAuthError(error: AuthError, userEmail?: string | null) {
  if (error.code === "auth/account-exists-with-different-credential") {
    const auth = await getFirebaseAuthClient();
    const email = error.customData?.email ?? userEmail ?? undefined;
    const methods =
      auth && email ? await fetchSignInMethodsForEmail(auth, email) : [];
    return describeProviderConflict(methods);
  }

  if (error.code === "auth/unauthorized-domain") {
    return "This domain is not authorized in Firebase Authentication yet. Add the current origin to the Firebase allowed domains list.";
  }

  if (error.code === "auth/popup-closed-by-user") {
    return "The sign-in popup was closed before the flow completed.";
  }

  return error.message || "Unable to complete sign-in right now.";
}

export function AuthFlowCard({
  mode,
  desktopProtocol,
}: {
  mode: "login" | "desktop";
  desktopProtocol?: string;
}) {
  const { user, loading, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busyProvider, setBusyProvider] = useState<"google" | "apple" | null>(
    null,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handledResult, setHandledResult] = useState(false);

  const billingCycle = useMemo<BillingCycle>(
    () => parseBillingCycle(searchParams.get("billing")),
    [searchParams],
  );

  const nextPath = searchParams.get("next");
  const intent = searchParams.get("intent");

  const resolveDesktopRedirect = useCallback((
    payload: Partial<DesktopCallbackPayload> & {
      error?: string;
      token?: string;
    },
  ) => {
    if (payload.redirectUrl && payload.code && payload.state) {
      return payload.redirectUrl;
    }

    if (payload.token) {
      return `${desktopProtocol ?? "projecto://"}auth/callback?token=${encodeURIComponent(payload.token)}`;
    }

    throw new Error(
      payload.error ?? "Unable to create a desktop sign-in callback.",
    );
  }, [desktopProtocol]);

  const finalizeLogin = useCallback(
    async (activeUser: User) => {
      setError(null);
      await syncFirebaseUser(activeUser);

      if (mode === "desktop") {
        setStatus("Creating a secure desktop sign-in callback...");

        const response = await authorizedFetch(
          activeUser,
          "/api/desktop/auth/create-code",
          {
            method: "POST",
          },
        );
        const payload = (await response.json()) as Partial<DesktopCallbackPayload> & {
          error?: string;
          token?: string;
        };

        if (!response.ok) {
          throw new Error(
            payload.error ?? "Unable to create desktop sign-in callback.",
          );
        }

        window.location.href = resolveDesktopRedirect(payload);
        return;
      }

      setStatus("Redirecting you back into projecto...");
      router.replace(
        buildPostLoginDestination({
          nextPath,
          intent,
          billingCycle,
        }),
      );
    },
    [billingCycle, intent, mode, nextPath, resolveDesktopRedirect, router],
  );

  async function startSignIn(kind: "google" | "apple") {
    setBusyProvider(kind);
    setError(null);
    setStatus(
      kind === "google"
        ? "Opening Google sign-in..."
        : "Opening Apple sign-in...",
    );

    const auth = await getFirebaseAuthClient();
    if (!auth) {
      setBusyProvider(null);
      setStatus(null);
      setError(
        "Firebase Authentication is not configured yet. Add the public Firebase environment variables to enable sign-in.",
      );
      return;
    }

    const provider = createProvider(kind);

    try {
      const result = await signInWithPopup(auth, provider);
      await finalizeLogin(result.user);
    } catch (authError) {
      const firebaseError = authError as AuthError;

      if (shouldFallbackToRedirect(firebaseError)) {
        await signInWithRedirect(auth, provider);
        return;
      }

      setStatus(null);
      setBusyProvider(null);
      setError(await describeAuthError(firebaseError));
    }
  }

  useEffect(() => {
    let active = true;

    void (async () => {
      if (!ready || handledResult) {
        return;
      }

      const auth = await getFirebaseAuthClient();
      if (!auth) {
        setHandledResult(true);
        return;
      }

      try {
        const result = await getRedirectResult(auth);
        if (!active) {
          return;
        }

        setHandledResult(true);
        if (result?.user) {
          await finalizeLogin(result.user);
        }
      } catch (redirectError) {
        if (!active) {
          return;
        }

        setHandledResult(true);
        setError(await describeAuthError(redirectError as AuthError));
      }
    })();

    return () => {
      active = false;
    };
  }, [finalizeLogin, handledResult, ready]);

  useEffect(() => {
    if (!user || loading || busyProvider || status) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void finalizeLogin(user).catch((finalizeError) => {
        setStatus(null);
        setError(
          finalizeError instanceof Error
            ? finalizeError.message
            : "Unable to finish sign-in.",
        );
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [busyProvider, finalizeLogin, loading, status, user]);

  return (
    <div className="section-shell flex py-16 sm:py-20">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,0.68fr)] lg:items-start">
        <div className="max-w-2xl">
          <div className="eyebrow reveal-1">
            {mode === "desktop" ? "Desktop sign-in" : "Authentication"}
          </div>
          <h1 className="reveal-2 mt-6 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            {mode === "desktop"
              ? "Connect your desktop app to your projecto account."
              : "Sign in to sync billing, subscriptions, and desktop access."}
          </h1>
          <p className="reveal-3 mt-5 text-lg leading-8 text-muted-strong">
            {mode === "desktop"
              ? "This page is opened by the Electron app so projecto can start a secure browser sign-in, create a short-lived desktop callback, and send you back to the app."
              : "Choose Google or Apple sign-in. projecto uses authentication only for account and subscription sync across your devices."}
          </p>
          <div className="reveal-3 mt-8 space-y-3 text-sm text-muted">
            <p>projecto never uploads your source code.</p>
            <p>Payments and subscriptions are handled securely through Dodo Payments.</p>
            <p>
              Google sign-in and Apple sign-in are used only for account and
              subscription sync.
            </p>
            <p>
              Google accounts use Firebase&apos;s verified email identity.
              projecto does not request Gmail inbox access.
            </p>
          </div>
        </div>

        <Card className="scan-line relative max-w-xl reveal-2">
          <div className="account-label">
            {mode === "desktop" ? "Continue in browser" : "Continue to projecto"}
          </div>
          <div className="mt-6 space-y-4">
            <Button
              className="w-full justify-between"
              disabled={!!busyProvider}
              onClick={() => void startSignIn("google")}
              type="button"
              variant="secondary"
            >
              <span>Continue with Google</span>
              {busyProvider === "google" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
            </Button>

            <Button
              className="w-full justify-between"
              disabled={!!busyProvider}
              onClick={() => void startSignIn("apple")}
              type="button"
              variant="secondary"
            >
              <span className="inline-flex items-center gap-2">
                <Apple className="size-4" />
                Continue with Apple
              </span>
              {busyProvider === "apple" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
            </Button>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-border bg-card p-4 text-sm leading-7 text-muted">
            <p>
              {mode === "desktop"
                ? "After sign-in, projecto creates a short-lived desktop callback and redirects you back to the desktop app through your configured desktop protocol."
                : "After sign-in, projecto saves your user profile and takes you to pricing or account depending on where you started."}
            </p>
          </div>

          {!ready ? (
            <p className="mt-5 text-sm text-amber">
              Firebase Authentication is not configured yet. Add the public Firebase
              keys before testing Google or Apple sign-in.
            </p>
          ) : null}
          {status ? (
            <p className="mt-5 inline-flex items-center gap-2 text-sm text-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              {status}
            </p>
          ) : null}
          {error ? <p className="mt-5 text-sm text-danger">{error}</p> : null}
        </Card>
      </div>
    </div>
  );
}
