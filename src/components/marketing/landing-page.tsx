import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Shield,
  Sparkles,
  TerminalSquare,
  Workflow,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    title: "Local-first workflow",
    description:
      "projecto is designed around your machine, your folders, and your existing tooling rather than a remote workspace.",
    icon: Shield,
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Add a project",
    description:
      "Point projecto at a folder or scan a parent workspace to import several repos in one move.",
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
    question: "Does projecto upload my code?",
    answer:
      "No. projecto never uploads your source code. It is built around a local-first workflow and keeps your project files on your machine.",
  },
  {
    question: "Why does projecto use Google or Apple sign-in?",
    answer:
      "Google sign-in and Apple sign-in are used only for account and subscription sync across devices. They do not grant inbox access or source-code access.",
  },
  {
    question: "How are payments handled?",
    answer:
      "Payments and subscriptions are handled securely through Dodo Payments. projecto uses the billing backend only to store subscription state and verify Pro access.",
  },
  {
    question: "Will desktop sync upload my project files?",
    answer:
      "No. Desktop sync is for account state, billing, and future settings sync. Your code stays on your machine.",
  },
];

const trustNotes = [
  "Your code stays on your machine.",
  "projecto never uploads your source code.",
  "Payments and subscriptions are handled securely through Dodo Payments.",
];

export function LandingPage() {
  const { downloadUrl } = getOptionalAppConfig();

  return (
    <div className="pb-24">
      <section className="section-shell section-divider relative overflow-hidden py-18 sm:py-24 lg:py-28">
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_60%)]" />
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center">
          <div className="max-w-3xl">
            <div className="eyebrow reveal-1">
              <Sparkles className="size-4" />
              Official projecto website
            </div>
            <p className="reveal-1 mt-7 font-mono text-xs uppercase tracking-[0.34em] text-muted">
              Open and run any dev project in one click.
            </p>
            <h1 className="reveal-2 mt-4 text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Local project startup, reduced to one quiet button.
            </h1>
            <p className="reveal-3 mt-6 max-w-2xl text-lg leading-8 text-muted-strong sm:text-xl">
              projecto gives developer machines a cleaner control layer: smart
              project folders, launch profiles, editor opening, command execution,
              stack detection, and account-backed billing sync without moving source
              code off your machine.
            </p>
            <div className="reveal-3 mt-10 flex flex-col gap-4 sm:flex-row">
              <Button href={downloadUrl} rel="noreferrer" target="_blank">
                Download App
                <ArrowRight className="size-4" />
              </Button>
              <Button href="/pricing" variant="secondary">
                View Pricing
              </Button>
            </div>
            <div className="reveal-3 mt-8 flex flex-wrap gap-3 text-sm text-muted-strong">
              {trustNotes.map((note) => (
                <div
                  key={note}
                  className="rounded-full border border-white/10 bg-white/4 px-4 py-2"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>

          <Card className="drift-slow scan-line relative overflow-hidden">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <div className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-muted">
                    Active workspace
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">
                    projecto-desktop
                  </div>
                </div>
                <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white">
                  Ready
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/4 p-4">
                  <div className="flex items-center gap-3 text-sm font-medium text-white">
                    <FolderKanban className="size-4 text-zinc-100" />
                    Smart folder detected
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    React frontend, Electron shell, Firebase auth helpers, and a
                    saved &quot;Run full stack&quot; profile.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/4 p-4">
                  <div className="flex items-center gap-3 text-sm font-medium text-white">
                    <TerminalSquare className="size-4 text-zinc-100" />
                    Launch profile
                  </div>
                  <div className="mt-3 space-y-2 font-mono text-xs text-muted-strong">
                    <div className="rounded-xl border border-white/8 bg-black/45 px-3 py-2">
                      open Cursor
                    </div>
                    <div className="rounded-xl border border-white/8 bg-black/45 px-3 py-2">
                      npm run dev:web
                    </div>
                    <div className="rounded-xl border border-white/8 bg-black/45 px-3 py-2">
                      npm run dev:desktop
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4">
                  <div className="flex items-center gap-3 text-sm font-medium text-white">
                    <Workflow className="size-4 text-zinc-100" />
                    Billing-aware sync
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    Pro access is verified through the projecto billing backend before
                    premium desktop features unlock.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="grid gap-5 md:grid-cols-3">
          <Card className="reveal-1">
            <div className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-muted">
              Problem
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Dev environments still start from memory instead of a durable system.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              Editors, terminals, and stack-specific commands get reopened manually
              every time developers move between projects.
            </p>
          </Card>

          <Card className="reveal-2">
            <div className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-muted">
              Solution
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              projecto saves the right startup ritual for every local codebase.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              Keep launch behavior close to your machine, your editors, and your real
              folders. Start faster without giving up local control.
            </p>
          </Card>

          <Card className="reveal-3">
            <div className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-muted">
              Security
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Local-first by default, not as a footnote.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              projecto never uploads your source code. Google and Apple sign-in are
              used only for account sync, and billing is handled through Dodo
              Payments.
            </p>
          </Card>
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="max-w-3xl">
          <div className="eyebrow">Features</div>
          <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            A sharper desktop workflow for teams that keep their code local.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className={index === 0 ? "reveal-1" : index < 3 ? "reveal-2" : "reveal-3"}
              >
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="max-w-xl">
            <div className="eyebrow">How It Works</div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Save once. Launch the same way every time.
            </h2>
            <p className="mt-5 text-base leading-8 text-muted">
              projecto combines project discovery, editor handoff, and command
              orchestration into a repeatable workflow that respects local machines.
            </p>
          </div>
          <div className="space-y-4">
            {workflowSteps.map((step, index) => (
              <Card
                key={step.step}
                className={index === 0 ? "reveal-1" : index === 1 ? "reveal-2" : "reveal-3"}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-muted">
                      Step {step.step}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-white">{step.title}</h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] text-muted-strong">
                    local workflow
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="reveal-1">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-white">
              <Shield className="size-4" />
              Security / Local-first
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-muted">
              <li className="flex gap-3">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-zinc-100" />
                <span>Your code stays on your machine.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-zinc-100" />
                <span>projecto never uploads your source code.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-zinc-100" />
                <span>
                  Google sign-in is used only for account and subscription sync.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-zinc-100" />
                <span>
                  Payments and subscriptions are handled securely through Dodo
                  Payments.
                </span>
              </li>
            </ul>
          </Card>

          <Card className="reveal-2">
            <div className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-muted">
              Pricing preview
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/4 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-white">Free</div>
                    <div className="text-sm text-muted">
                      Local-only use with lightweight setup limits
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-white">$0</div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-white">Pro</div>
                    <div className="text-sm text-muted">
                      Unlimited projects, advanced presets, and future sync support
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-white">$12/mo</div>
                    <div className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-muted">
                      or $96 yearly
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Button className="mt-6" href="/pricing" variant="secondary">
              Explore full pricing
            </Button>
          </Card>
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="max-w-2xl">
          <div className="eyebrow">FAQ</div>
          <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            The questions teams ask before they standardize on projecto.
          </h2>
        </div>
        <div className="mt-8 space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              className={`glass-panel surface-outline rounded-[2rem] p-6 ${index === 0 ? "reveal-1" : index < 3 ? "reveal-2" : "reveal-3"}`}
            >
              <summary className="cursor-pointer list-none text-lg font-semibold text-white">
                {faq.question}
              </summary>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
