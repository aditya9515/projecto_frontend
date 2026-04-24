import type { Metadata } from "next";

import { SuccessPanel } from "@/components/checkout/success-panel";
import { getOptionalAppConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Checkout Success",
  description: "LaunchStack payment success and subscription sync.",
};

export default function CheckoutSuccessPage() {
  const { desktopProtocol } = getOptionalAppConfig();

  return <SuccessPanel desktopProtocol={desktopProtocol} />;
}
