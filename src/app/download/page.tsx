import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Download,
  LaptopMinimal,
  Monitor,
  ShieldCheck,
} from "lucide-react";

import { DemoVideoSection } from "@/components/marketing/demo-video-section";
import { RollingText } from "@/components/motion/rolling-text";
import { Button } from "@/components/ui/button";
import { getWindowsInstallerMetadata } from "@/lib/desktop-update";

export const metadata: Metadata = {
  title: "Download",
  description: "Projecto desktop download hub.",
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
      detail: "Signed macOS builds will ship after the signing pipeline is ready.",
      icon: LaptopMinimal,
      status: "Coming soon",
    },
    {
      name: "Linux",
      detail: "Linux packages will ship after cross-platform packaging is complete.",
      icon: Download,
      status: "Coming soon",
    },
  ];

  return (
    <div>
      <section className="section-shell pb-12 pt-16 sm:pb-16 sm:pt-24" data-hero>
        <div className="flex flex-wrap items-center gap-3" data-hero-meta>
          <div className="eyebrow">Projecto desktop</div>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">
            Windows x64 / Rolcy
          </span>
        </div>
        <h1 className="mt-8 max-w-6xl text-[clamp(4rem,10vw,9rem)] font-medium leading-[0.82] tracking-[-0.075em]">
          <span className="mask-line"><span data-hero-line>Download.</span></span>
          <span className="mask-line text-muted"><span data-hero-line>Launch locally.</span></span>
        </h1>
      </section>

      <section className="dark-field noise-field border-y border-[#353532] py-12 sm:py-16">
        <div className="section-shell">
          <div className="overflow-hidden rounded-[10px] border border-[#555550] bg-[#202020]" data-reveal>
            <div className="flex flex-col gap-4 border-b border-[#41413e] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-[6px] bg-brand text-foreground">
                  <Download className="size-5" />
                </span>
                <div>
                  <div className="font-medium">Projecto Setup</div>
                  <div className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-[#92928d]">Publisher / Rolcy</div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-brand">
                <BadgeCheck className="size-4" /> Release available
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
              <div className="border-b border-[#41413e] p-6 sm:p-9 lg:border-b-0 lg:border-r">
                <div className="account-label">Windows x64 / Current package</div>
                <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-5xl font-medium leading-none tracking-[-0.06em] sm:text-6xl">
                      Projecto {windowsInstaller.version}
                    </h2>
                    <p className="mt-5 max-w-xl text-sm leading-7 text-[#aaa9a3]">
                      Visible OS Terminal sessions, mapped project launches, run logs,
                      account sync, and online subscription verification.
                    </p>
                  </div>
                  <span className="rounded-[4px] border border-brand px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-brand">Ready</span>
                </div>

                <div className="mt-9 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <div className="flex justify-between font-mono text-[0.65rem] uppercase tracking-[0.08em] text-[#92928d]">
                      <span>Installer prepared</span><span>100%</span>
                    </div>
                    <div className="mt-3 h-2 border border-[#555550] bg-[#151515] p-px">
                      <div className="h-full w-full bg-brand" />
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#aaa9a3]">{windowsInstaller.size}</span>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button download={windowsInstaller.fileName} href={windowsInstaller.href}>
                    <RollingText>Download for Windows</RollingText>
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button href="/pricing" variant="secondary" className="border-[#666660] text-[#f1f1f1] hover:border-brand hover:bg-brand hover:text-foreground">
                    <RollingText>View pricing</RollingText>
                  </Button>
                </div>
              </div>

              <div className="p-6 sm:p-9">
                <div className="inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.1em]">
                  <ShieldCheck className="size-4 text-brand" /> Package details
                </div>
                <dl className="mt-7 border-t border-[#41413e] text-sm">
                  {[
                    ["Publisher", "Rolcy"],
                    ["File", windowsInstaller.fileName],
                    ["Size", windowsInstaller.size],
                  ].map(([term, value]) => (
                    <div className="border-b border-[#41413e] py-4" key={term}>
                      <dt className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-[#92928d]">{term}</dt>
                      <dd className="mt-1 break-all text-[#e1e1dc]">{value}</dd>
                    </div>
                  ))}
                  <div className="border-b border-[#41413e] py-4">
                    <dt className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-[#92928d]">SHA-256</dt>
                    <dd className="mt-2 break-all font-mono text-[0.65rem] leading-5 text-[#aaa9a3]">{windowsInstaller.sha256}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DemoVideoSection />

      <section className="section-shell py-16 sm:py-24">
        <div className="flex flex-col gap-5 border-b border-border-strong pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="eyebrow" data-reveal>Platforms</div>
            <h2 className="mt-5 text-4xl font-medium tracking-[-0.055em] sm:text-6xl" data-reveal>One launcher. More platforms next.</h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-muted">Windows is available now. Signed macOS and Linux packages follow the packaging pipeline.</p>
        </div>

        <div className="grid md:grid-cols-3">
          {platformCards.map((platform, index) => {
            const Icon = platform.icon;
            return (
              <article className="flex flex-col border-b border-border-strong py-7 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0" data-reveal key={platform.name}>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[0.65rem] text-muted">0{index + 1}</span>
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-14 text-3xl font-medium tracking-[-0.045em]">{platform.name}</h3>
                <p className="mt-4 flex-1 text-sm leading-7 text-muted">{platform.detail}</p>
                {platform.href ? (
                  <Button className="mt-7 w-full" download={platform.fileName} href={platform.href}>
                    <RollingText>Download Windows</RollingText>
                  </Button>
                ) : (
                  <button className="projecto-disabled-control mt-7 min-h-12 w-full rounded-[6px] border px-5 font-mono text-xs uppercase tracking-[0.08em]" disabled type="button">
                    {platform.status}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-10 grid gap-4 rounded-[8px] border border-border-strong bg-card p-6 sm:grid-cols-2 sm:p-8" data-reveal>
          {[
            `Version ${windowsInstaller.version}`,
            `${windowsInstaller.size} Windows x64 installer`,
            "Visible OS Terminal launch flow",
            "Account, billing, and desktop verification enabled",
          ].map((detail) => (
            <div className="flex gap-3 text-sm" key={detail}><Check className="size-4 shrink-0" /><span>{detail}</span></div>
          ))}
        </div>
      </section>
    </div>
  );
}
