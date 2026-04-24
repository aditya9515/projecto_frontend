import type { Metadata } from "next";

import { SuccessPanel } from "@/components/checkout/success-panel";

export const metadata: Metadata = {
  title: "Checkout Success",
  description: "projecto payment success and subscription sync.",
};

export default function CheckoutSuccessPage() {
  return <SuccessPanel />;
}
