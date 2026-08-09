import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Check,
  FolderKanban,
  Plus,
  Shield,
  Sparkles,
  TerminalSquare,
  Workflow,
} from "lucide-react";

import { DemoVideoSection } from "@/components/marketing/demo-video-section";
import { RollingText } from "@/components/motion/rolling-text";
import { Button } from "@/components/ui/button";
import { getOptionalAppConfig } from "@/lib/env";

const featureCards: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Smart project folders",
    description:
      "Keep local repositories organized once, then reopen them with the exact launch behavior you expect.",
    icon: FolderKanban,
  },
  {
    title: "Launch profiles",
    description:
      "Save the scripts, terminals, editors, and startup order that belong to each project.",
    icon: Workflow,
  },
  {
    title: "Editor opening",
    description:
      "Jump into the right editor without repeating the same setup steps every time you switch repos.",
    icon: TerminalSquare,
  },
  {
    title: "Command execution",
    description:
      "Run stack-specific commands from one launch action instead of rebuilding your workspace by memory.",
    icon: TerminalSquare,
  },
  {
    title: "Stack detection",
    description:
      "Detect common frontend, backend, and desktop stacks and suggest a clean starting preset.",
    icon: Sparkles,
  },
  {
    title: "Local code, synced control",
    description:
      "Projecto keeps source code on your machine while syncing account, billing, and project directory metadata through the hosted backend.",
    icon: Shield,
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Add a project",
    description:
      "Point Projecto at a folder or scan a parent workspace to import several repos in one move.",
  },
  {
    step: "02",
    title: "Save launch behavior",
    description:
      "Attach editors, scripts, terminals, and stack-aware presets so startup becomes repeatable.",
  },
  {
    step: "03",
    title: "Launch in one click",
    description:
      "Open the project, run the commands, and land in a ready-to-work local environment faster.",
  },
];

const faqs = [
  {
    question: "Does Projecto upload my code?",
    answer:
      "No. Projecto never uploads your source code. It keeps project files on your machine and only syncs account, billing, and project directory metadata.",
  },
  {
    question: "Why does Projecto use Google or Apple sign-in?",
    answer:
      "Google sign-in and Apple sign-in are used only for account and subscription sync across devices. They do not grant inbox access or source-code access.",
  },
  {
    question: "How are payments handled?",
    answer:
      "Payments and subscriptions are handled securely through Dodo Payments. Projecto uses the billing backend only to store subscription state and verify Pro access.",
  },
  {
    question: "Will desktop sync upload my project files?",
    answer:
      "No. Desktop sync is for account state, billing, and project directory metadata. Your code stays on your machine.",
  },
];

const trustNotes = [
  "Your code stays on your machine.",
  "Projecto never uploads your source code.",
  "Subscriptions are handled through Dodo Payments.",
];

export function LandingPage() {
  const { downloadUrl } = getOptionalAppConfig();

  return (
    <div>
      <section
        className="section-divider relative overflow-hidden pb-10 pt-14 sm:pb-14 sm:pt-20 lg:pt-24"
        data-hero
      >
        <div className="section-shell">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3" data-hero-meta>
                <div className="eyebrow">
                  <Sparkles className="size-3.5" />
                  Projecto desktop
                </div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.13em] text-muted">
                  Local-first / Online verified
                </p>
              </div>

              <h1 className="mt-8 max-w-5xl text-[clamp(3.4rem,8vw,7.8rem)] font-medium leading-[0.83] tracking-[-0.075em] text-foreground">
                <span className="mask-line">
                  <span data-hero-line>Open any project.</span>
                </span>
                <span className="mask-line text-muted">
                  <span data-hero-line>Run it in one click.</span>
                </span>
              </h1>

              <div className="mt-9 grid max-w-3xl gap-7 border-t border-border-strong pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
                <p
                  className="max-w-xl text-base leading-7 text-muted-strong sm:text-lg sm:leading-8"
                  data-hero-support
                >
                  Smart folders, saved launch profiles, editor opening, command
                  execution, and stack detection in one focused desktop workspace.
                </p>
                <div className="flex flex-col gap-3 sm:items-end" data-hero-support>
                  <Button href={downloadUrl} rel="noreferrer" target="_blank">
                    <RollingText>Download app</RollingText>
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button href="/pricing" variant="ghost">
                    <RollingText>View pricing</RollingText>
                  </Button>
                </div>
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-[10px] border border-border-strong bg-foreground p-3 text-background"
              data-hero-support
            >
              <div className="flex items-center justify-between border-b border-[#3b3b38] px-2 pb-3 pt-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#aaa9a3]">
                <span>Workspace / Active</span>
                <span className="inline-flex items-center gap-2 text-brand">
                  <span className="size-2 rounded-full bg-brand" /> Ready
                </span>
              </div>

              <div className="grid min-h-[470px] grid-rows-[auto_1fr_auto] gap-3 pt-3">
                <div className="rounded-[6px] border border-[#3b3b38] bg-[#1a1a1a] p-5">
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#8e8e89]">
                    Selected project
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div className="text-2xl font-medium tracking-[-0.04em]">
                      projecto-desktop
                    </div>
                    <FolderKanban className="size-5 text-brand" />
                  </div>
                  <div className="mt-5 h-px bg-[#3b3b38]" />
                  <div className="mt-4 flex flex-wrap gap-2 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-[#c4c4be]">
                    <span className="rounded-[3px] border border-[#4a4a46] px-2 py-1">React</span>
                    <span className="rounded-[3px] border border-[#4a4a46] px-2 py-1">Electron</span>
                    <span className="rounded-[3px] border border-[#4a4a46] px-2 py-1">Firebase</span>
                  </div>
                </div>

                <div className="rounded-[6px] border border-[#3b3b38] bg-[#1a1a1a] p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#8e8e89]">
                      Launch profile
                    </div>
                    <span className="font-mono text-[0.62rem] text-brand">03 actions</span>
                  </div>
                  <div className="mt-4 space-y-2 font-mono text-xs text-[#d7d7d1]">
                    {["open Cursor", "npm run dev:web", "npm run dev:desktop"].map(
                      (command, index) => (
                        <div
                          className="flex items-center gap-3 rounded-[4px] border border-[#3b3b38] px-3 py-3"
                          key={command}
                        >
                          <span className="text-[#6e6e69]">0{index + 1}</span>
                          <span>{command}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-[6px] border border-brand bg-brand px-4 py-3 text-foreground">
                  <div>
                    <div className="font-mono text-[0.62rem] uppercase tracking-[0.1em]">
                      One-click launch
                    </div>
                    <div className="mt-1 text-sm font-semibold">Profile ready to run</div>
                  </div>
                  <ArrowRight className="size-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid border-y border-border-strong sm:grid-cols-3" data-hero-support>
            {trustNotes.map((note, index) => (
              <div
                className="flex min-h-16 items-center gap-3 border-b border-border px-4 py-4 text-sm last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                key={note}
              >
                <span className="font-mono text-[0.62rem] text-muted">0{index + 1}</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DemoVideoSection />

      <section className="section-shell py-16 sm:py-24">
        <div className="grid border-y border-border-strong md:grid-cols-3">
          {[
            {
              label: "Problem",
              title: "Dev environments still start from memory.",
              copy: "Editors, terminals, and stack-specific commands get reopened manually every time developers move between projects.",
            },
            {
              label: "Solution",
              title: "Save the startup ritual for each codebase.",
              copy: "Keep launch behavior close to your machine, your editors, and your real folders. Start faster without giving up local control.",
            },
            {
              label: "Principle",
              title: "Local-first is the architecture, not a footnote.",
              copy: "Projecto never uploads source code. Account sync stays focused on identity, billing, and project directory metadata.",
            },
          ].map((item, index) => (
            <article
              className="border-b border-border px-0 py-7 last:border-b-0 md:border-b-0 md:border-r md:px-7 md:last:border-r-0"
              data-reveal
              key={item.label}
            >
              <div className="account-label">0{index + 1} / {item.label}</div>
              <h2 className="mt-7 text-3xl font-medium leading-[1.02] tracking-[-0.05em]">
                {item.title}
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dark-field noise-field border-y border-[#343431] py-16 sm:py-24">
        <div className="section-shell">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <div className="eyebrow" data-reveal>Features</div>
              <p className="mt-5 max-w-sm text-sm leading-7 text-[#aaa9a3]" data-reveal>
                Six focused capabilities. No cloud IDE, no source-code upload, no
                replacement for the tools you already trust.
              </p>
            </div>
            <h2
              className="text-4xl font-medium leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl"
              data-reveal
            >
              One control layer for the work already on your machine.
            </h2>
          </div>

          <div className="mt-12 h-px bg-[#4a4a46]" data-line-reveal />

          <div className="mt-0 grid md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  className="group border-b border-[#3a3a37] py-8 md:px-7 md:nth-[even]:border-l lg:border-l lg:first:border-l-0 lg:nth-[4]:border-l-0"
                  data-reveal
                  key={feature.title}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[0.65rem] text-[#777772]">0{index + 1}</span>
                    <Icon className="size-5 text-brand transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
                  </div>
                  <h3 className="mt-16 text-2xl font-medium tracking-[-0.04em]">
                    {feature.title}
                  </h3>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-[#aaa9a3]">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-shell py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <div className="eyebrow" data-reveal>How it works</div>
            <h2
              className="mt-6 max-w-lg text-4xl font-medium leading-[0.96] tracking-[-0.055em] sm:text-6xl"
              data-reveal
            >
              Save once. Launch the same way every time.
            </h2>
          </div>

          <div className="border-t border-border-strong">
            {workflowSteps.map((step) => (
              <article
                className="grid gap-5 border-b border-border-strong py-7 sm:grid-cols-[80px_0.75fr_1.25fr] sm:items-start"
                data-reveal
                key={step.step}
              >
                <span className="font-mono text-xs text-muted">{step.step}</span>
                <h3 className="text-2xl font-medium tracking-[-0.04em]">{step.title}</h3>
                <p className="text-sm leading-7 text-muted">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border-strong bg-brand py-16 text-foreground sm:py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.12em]" data-reveal>
              <Shield className="size-4" /> Security / Local-first
            </div>
            <h2
              className="mt-7 max-w-4xl text-5xl font-medium leading-[0.9] tracking-[-0.065em] sm:text-7xl"
              data-reveal
            >
              Your source code is never part of the sync.
            </h2>
          </div>
          <ul className="border-t border-foreground" data-reveal>
            {[
              "Your code stays on your machine.",
              "Projecto never uploads your source code.",
              "Google and Apple sign-in are only for account sync.",
              "Dodo Payments securely handles subscriptions.",
            ].map((note) => (
              <li className="flex gap-3 border-b border-foreground py-4 text-sm" key={note}>
                <Check className="mt-0.5 size-4 shrink-0" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-shell py-16 sm:py-24">
        <div className="flex flex-col gap-5 border-b border-border-strong pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="eyebrow" data-reveal>Pricing preview</div>
            <h2 className="mt-5 text-4xl font-medium tracking-[-0.055em] sm:text-6xl" data-reveal>
              Start focused. Scale when ready.
            </h2>
          </div>
          <Button href="/pricing" variant="secondary">
            <RollingText>Compare plans</RollingText>
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="grid lg:grid-cols-2">
          <article className="border-b border-border-strong py-8 lg:border-b-0 lg:border-r lg:pr-10" data-reveal>
            <div className="account-label">Free / $0 forever</div>
            <h3 className="mt-12 text-4xl font-medium tracking-[-0.05em]">Five projects. One launch at a time.</h3>
            <p className="mt-5 max-w-lg text-sm leading-7 text-muted">
              Basic detection and local launcher controls for a smaller workspace.
            </p>
          </article>
          <article className="relative py-8 lg:pl-10" data-reveal>
            <span className="absolute right-0 top-8 rounded-[4px] bg-brand px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.1em]">
              Unlimited
            </span>
            <div className="account-label">Pro / $8 monthly</div>
            <h3 className="mt-12 max-w-xl text-4xl font-medium tracking-[-0.05em]">
              Advanced detection, bulk import, and every Pro update.
            </h3>
            <p className="mt-5 text-sm text-muted">Or $80 billed yearly.</p>
          </article>
        </div>
      </section>

      <section className="section-shell pb-20 sm:pb-28">
        <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
          <div>
            <div className="eyebrow" data-reveal>FAQ</div>
            <h2 className="mt-6 text-4xl font-medium leading-[0.96] tracking-[-0.055em] sm:text-5xl" data-reveal>
              Before you launch.
            </h2>
          </div>
          <div className="border-t border-border-strong">
            {faqs.map((faq) => (
              <details className="group border-b border-border-strong" data-reveal key={faq.question}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-lg font-medium sm:text-xl">
                  <span>{faq.question}</span>
                  <span className="faq-plus flex size-8 shrink-0 items-center justify-center rounded-[4px] border border-border-strong">
                    <Plus className="size-4" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-7 text-sm leading-7 text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
