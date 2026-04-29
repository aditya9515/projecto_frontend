import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthFlowCard } from "@/components/auth/auth-flow-card";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to projecto with Google or Apple.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="section-shell py-16 text-muted">Loading sign-in...</div>
      }
    >
      <AuthFlowCard mode="login" />
    </Suspense>
  );
}
