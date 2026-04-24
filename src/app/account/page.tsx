import type { Metadata } from "next";

import { AccountDashboard } from "@/components/account/account-dashboard";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your LaunchStack subscription and billing.",
};

export default function AccountPage() {
  return <AccountDashboard />;
}
