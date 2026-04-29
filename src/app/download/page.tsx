import type { Metadata } from "next";
import { Download, LaptopMinimal, Monitor, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const platformCards = [
  {
    name: "Windows",
    detail: "Installer release path pending",
    icon: Monitor,
  },
  {
    name: "macOS",
    detail: "Signed build path pending",
    icon: LaptopMinimal,
  },
  {
    name: "Linux",
    detail: "Package path pending",
    icon: Download,
  },
];

export const metadata: Metadata = {
  title: "Download",
  description: "projecto desktop download hub.",
};

export default function DownloadPage() {
  return (
    <div className="section-shell py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <div className="eyebrow reveal-1 justify-center">Download</div>
        <h1 className="reveal-2 mt-6 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
          projecto desktop rollout.
        </h1>
        <p className="reveal-3 mt-5 text-lg leading-8 text-muted-strong">
          This site is ready for auth, billing, and subscription sync. Installer
          links can be published here as soon as your desktop release assets are
          available.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
        {platformCards.map((platform, index) => {
          const Icon = platform.icon;

          return (
            <Card
              key={platform.name}
              className={index === 0 ? "reveal-1" : index === 1 ? "reveal-2" : "reveal-3"}
            >
              <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card-strong text-foreground">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-foreground">{platform.name}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{platform.detail}</p>
              <button
                className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-muted-strong opacity-70"
                disabled
                type="button"
              >
                Coming soon
              </button>
            </Card>
          );
        })}
      </div>

      <Card className="reveal-2 mx-auto mt-8 max-w-4xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
              <ShieldCheck className="size-4" />
              Ready now
            </div>
            <p className="mt-4 text-sm leading-7 text-muted">
              Google and Apple sign-in, billing, subscriptions, and desktop access
              verification are already live. If you already have the app installed,
              you can sign in and continue from pricing or account.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/pricing">View Pricing</Button>
            <Button href="/login" variant="secondary">
              Sign in
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
