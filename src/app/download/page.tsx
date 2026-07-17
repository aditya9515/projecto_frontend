import type { Metadata } from "next";
import {
  BadgeCheck,
  CheckCircle2,
  Download,
  FileDown,
  LaptopMinimal,
  Monitor,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoVideoSection } from "@/components/marketing/demo-video-section";
import { getWindowsInstallerMetadata } from "@/lib/desktop-update";

export const metadata: Metadata = {
  title: "Download",
  description: "projecto desktop download hub.",
};

export default function DownloadPage() {
  const windowsInstaller = getWindowsInstallerMetadata();
  const platformCards = [
    {
      name: "Windows",
      detail: `Projecto ${windowsInstaller.version} for Windows x64.`,
      icon: Monitor,
      status: "Available now",
      href: windowsInstaller.href,
      fileName: windowsInstaller.fileName,
    },
    {
      name: "macOS",
      detail:
        "Signed macOS builds will be published after the signing pipeline is ready.",
      icon: LaptopMinimal,
      status: "Coming soon",
    },
    {
      name: "Linux",
      detail: "Linux DEB/RPM packages will be published after cross-platform packaging.",
      icon: Download,
      status: "Coming soon",
    },
  ];

  return (
    <div className="section-shell py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow reveal-1">Projecto Desktop</p>
        <h1 className="reveal-2 mt-5 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
          Download Projecto.
        </h1>
        <p className="reveal-3 mt-5 text-lg leading-8 text-muted-strong">
          Windows build by Rolcy, packaged for local project launch workflows.
        </p>
      </div>

      <section className="reveal-2 mx-auto mt-12 max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card text-foreground">
        <div className="flex items-center justify-between border-b border-border bg-card-strong px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="projecto-icon-surface flex size-11 items-center justify-center rounded-2xl border">
              <FileDown className="size-5" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">Projecto Setup</div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
                by Rolcy
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm font-semibold text-foreground sm:flex">
            <BadgeCheck className="size-4" />
            Verified release
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                  Windows x64
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
                  Projecto {windowsInstaller.version}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
                  Desktop launcher with visible OS Terminal sessions, mapped
                  project runs, run logs, account sync, and subscription
                  checks.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold">
                Ready
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                <span>Download package</span>
                <span>{windowsInstaller.size}</span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full border border-border bg-card-strong">
                <div className="h-full w-full rounded-full bg-emerald" />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>Installer prepared</span>
                <span>100%</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                className="w-full shadow-none hover:shadow-none sm:w-auto"
                download={windowsInstaller.fileName}
                href={windowsInstaller.href}
              >
                <Download className="size-4" />
                Download for Windows
              </Button>
              <Button
                className="w-full shadow-none hover:shadow-none sm:w-auto"
                href="/pricing"
                variant="secondary"
              >
                View Pricing
              </Button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
              <ShieldCheck className="size-4" />
              Details
            </div>
            <dl className="mt-5 grid gap-4 text-sm">
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <dt className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                  Publisher
                </dt>
                <dd className="mt-1 font-semibold text-foreground">Rolcy</dd>
              </div>
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <dt className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                  File
                </dt>
                <dd className="mt-1 break-all font-semibold text-foreground">
                  {windowsInstaller.fileName}
                </dd>
              </div>
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <dt className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                  SHA-256
                </dt>
                <dd className="mt-1 break-all font-mono text-xs leading-6 text-muted-strong">
                  {windowsInstaller.sha256}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <DemoVideoSection />

      <div className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-3">
        {platformCards.map((platform, index) => {
          const Icon = platform.icon;

          return (
            <Card
              key={platform.name}
              className={index === 0 ? "reveal-1" : index === 1 ? "reveal-2" : "reveal-3"}
            >
              <div className="projecto-icon-surface flex size-12 items-center justify-center rounded-2xl border">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-foreground">{platform.name}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{platform.detail}</p>
              {platform.href ? (
                <Button
                  className="mt-8 w-full shadow-none hover:shadow-none"
                  download={platform.fileName}
                  href={platform.href}
                >
                  <Download className="size-4" />
                  Download for Windows
                </Button>
              ) : (
                <button
                  className="projecto-disabled-control mt-8 inline-flex w-full items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold"
                  disabled
                  type="button"
                >
                  {platform.status}
                </button>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="reveal-2 mx-auto mt-8 max-w-4xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
              <ShieldCheck className="size-4" />
              Release details
            </div>
            <ul className="mt-4 grid gap-3 text-sm leading-7 text-muted sm:grid-cols-2">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-foreground" />
                <span>Version {windowsInstaller.version}</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-foreground" />
                <span>{windowsInstaller.size} Windows x64 installer</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-foreground" />
                <span>Visible OS Terminal launch flow</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-foreground" />
                <span>Account, billing, and desktop verification enabled</span>
              </li>
            </ul>
            <p className="mt-4 break-all font-mono text-xs leading-6 text-muted">
              SHA-256: {windowsInstaller.sha256}
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
