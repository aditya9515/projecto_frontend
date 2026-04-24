import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthFlowCard } from "@/components/auth/auth-flow-card";
import { getOptionalAppConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Desktop Login",
  description: "Sign in to projecto and return to the desktop app.",
};

export default function DesktopLoginPage() {
  const { desktopProtocol } = getOptionalAppConfig();

  return (
    <Suspense fallback={<div className="section-shell py-16 text-muted">Loading desktop sign-in…</div>}>
      <AuthFlowCard desktopProtocol={desktopProtocol} mode="desktop" />
    </Suspense>
  );
}
