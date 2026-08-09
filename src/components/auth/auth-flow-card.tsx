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
import { RollingText } from "@/components/motion/rolling-text";
import { Button } from "@/components/ui/button";
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
    <div className="section-shell py-12 sm:py-20">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[10px] border border-border-strong bg-card lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-card-strong p-7 sm:p-10 lg:p-14">
          <div className="eyebrow" data-reveal>
            {mode === "desktop" ? "Desktop sign-in" : "Authentication"}
          </div>
          <h1 className="mt-8 max-w-2xl text-5xl font-medium leading-[0.92] tracking-[-0.06em] sm:text-6xl" data-reveal>
            {mode === "desktop"
              ? "Connect the app. Keep the token off the URL."
              : "One account for billing and desktop access."}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-muted-strong" data-reveal>
            {mode === "desktop"
              ? "Projecto creates a short-lived, one-time callback in the browser and returns you safely to the Electron app."
              : "Choose Google or Apple. Authentication is used only for account and subscription sync across your devices."}
          </p>

          <div className="mt-10 border-t border-border-strong" data-reveal>
            {[
              "Projecto never uploads your source code.",
              "Dodo Payments securely handles subscriptions.",
              "Google and Apple sign-in are only for account sync.",
              "Projecto never requests Gmail inbox access.",
            ].map((note, index) => (
              <div className="flex gap-3 border-b border-border py-3 text-sm text-muted" key={note}>
                <span className="font-mono text-[0.62rem]">0{index + 1}</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dark-field noise-field order-first flex flex-col justify-between p-7 sm:p-10 lg:order-last lg:p-14" data-reveal>
          <div>
            <div className="account-label">
              {mode === "desktop" ? "Continue in browser" : "Continue to Projecto"}
            </div>
            <h2 className="mt-5 text-3xl font-medium tracking-[-0.045em]">
              Choose your sign-in provider.
            </h2>

            <div className="mt-8 space-y-3">
              <Button
                className="w-full justify-between border-background bg-background text-foreground hover:border-brand hover:bg-brand hover:text-foreground"
                disabled={!!busyProvider}
                onClick={() => void startSignIn("google")}
                type="button"
              >
                <RollingText>Continue with Google</RollingText>
                {busyProvider === "google" ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              </Button>

              <Button
                className="w-full justify-between border-[#555550] text-[#f1f1f1] hover:border-brand hover:bg-brand hover:text-foreground"
                disabled={!!busyProvider}
                onClick={() => void startSignIn("apple")}
                type="button"
                variant="secondary"
              >
                <span className="inline-flex items-center gap-2">
                  <Apple className="size-4" />
                  <RollingText>Continue with Apple</RollingText>
                </span>
                {busyProvider === "apple" ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              </Button>
            </div>

            <div className="mt-7 rounded-[6px] border border-[#454541] bg-[#202020] p-4 text-sm leading-7 text-[#aaa9a3]">
              {mode === "desktop"
                ? "After sign-in, Projecto creates a short-lived desktop callback and redirects through the configured Projecto protocol."
                : "After sign-in, Projecto syncs your profile and resumes the pricing or account flow where you started."}
            </div>
          </div>

          <div className="mt-8 min-h-7" aria-live="polite">
            {!ready ? <p className="text-sm text-brand">Firebase Authentication is not configured yet.</p> : null}
            {status ? <p className="inline-flex items-center gap-2 text-sm text-[#f1f1f1]"><LoaderCircle className="size-4 animate-spin" />{status}</p> : null}
            {error ? <p className="text-sm text-[#ff9a9a]">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
