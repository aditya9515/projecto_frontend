import type { Metadata } from "next";
import { Suspense } from "react";

import { PricingPageClient } from "@/components/pricing/pricing-page-client";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free and Pro pricing for LaunchStack.",
};

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="section-shell py-16 text-muted">Loading pricing…</div>}>
      <PricingPageClient />
    </Suspense>
  );
}
