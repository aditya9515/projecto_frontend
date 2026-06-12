import type { Metadata } from "next";
import { CheckCircle2, Download, LaptopMinimal, Monitor, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const windowsInstaller = {
  href: "https://github.com/aditya9515/Projecto/releases/download/v1.0.0/Projecto-1.0.0.Setup.exe",
  fileName: "Projecto-1.0.0.Setup.exe",
  sha256: "747F12FFC7137BAA26064DD86877F25C5CCD32307131A280B443D11C6AE2B9C5",
  size: "139.4 MB",
  version: "1.0.0",
};

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
    detail: "Signed macOS builds will be published after the signing pipeline is ready.",
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

export const metadata: Metadata = {
  title: "Download",
  description: "projecto desktop download hub.",
};

export default function DownloadPage() {
  return (
    <div className="section-shell py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="reveal-2 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
          Download Projecto for Windows.
        </h1>
        <p className="reveal-3 mt-5 text-lg leading-8 text-muted-strong">
          Install the Projecto desktop app, sign in with your Projecto account,
          and launch your local developer workspaces with the mapped terminal
          workflow.
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
              <div className="projecto-icon-surface flex size-12 items-center justify-center rounded-2xl border">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-foreground">{platform.name}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{platform.detail}</p>
              {platform.href ? (
                <Button
                  className="mt-8 w-full"
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
                <span>OS Terminal and Editor Terminal modes</span>
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
