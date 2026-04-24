import { ArrowRight, CheckCircle2, FolderKanban, Shield, Sparkles, TerminalSquare, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOptionalAppConfig } from "@/lib/env";

const featureCards = [
  {
    title: "Smart project folders",
    description:
      "Organize local workspaces once, then open them with the right launch behavior every time.",
  },
  {
    title: "Launch profiles",
    description:
      "Save dev scripts, editor targets, terminals, and run commands for each project.",
  },
  {
    title: "Editor opening",
    description:
      "Jump into VS Code or your preferred editor without hunting for the right folder.",
  },
  {
    title: "Command execution",
    description:
      "Run the commands your stack needs from a single consistent launch action.",
  },
  {
    title: "Stack detection",
    description:
      "Detect common stacks and suggest the right launch preset for React, Electron, Node, and more.",
  },
  {
    title: "Local-first workflow",
    description:
      "Everything is designed around your machine first, not a cloud dependency or remote workspace.",
  },
];

const workflowSteps = [
  {
    title: "1. Add a project",
    description:
      "Point LaunchStack at a folder or import multiple repos in bulk with one scan.",
  },
  {
    title: "2. Save launch behavior",
    description:
      "Attach profiles for editor opening, terminals, scripts, and the right stack-specific commands.",
  },
  {
    title: "3. Open in one click",
    description:
      "LaunchStack opens the project, starts the right tools, and gets you to a running dev environment faster.",
  },
];

const faqs = [
  {
    question: "Does LaunchStack upload my code?",
    answer:
      "No. LaunchStack never uploads your source code. The product is built around a local-first workflow and keeps your project files on your machine.",
  },
  {
    question: "Why does LaunchStack use Google or Apple sign-in?",
    answer:
      "Google sign-in and Apple sign-in are used only for account and subscription sync across devices. They do not grant inbox access or source-code access.",
  },
  {
    question: "How are payments handled?",
    answer:
      "Payments and subscriptions are handled securely through Dodo Payments. LaunchStack uses the billing backend only to store your subscription state and verify Pro access.",
  },
  {
    question: "Will desktop sync upload my project files?",
    answer:
      "No. Desktop sync is for account state, billing, and future settings sync. Your code stays local.",
  },
];

export function LandingPage() {
  const { downloadUrl } = getOptionalAppConfig();

  return (
    <div className="pb-20">
      <section className="section-shell relative overflow-hidden py-18 sm:py-24">
        <div className="grid-fade absolute inset-0 -z-20 opacity-60" />
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center">
          <div className="max-w-3xl">
            <div className="eyebrow fade-up">
              <Sparkles className="size-4" />
              Official LaunchStack website
            </div>
            <h1 className="fade-up-delayed mt-7 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Open and run any dev project in one click.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-strong sm:text-xl">
              LaunchStack gives local projects a clean control plane: smart folders,
              launch profiles, stack detection, editor opening, and command execution
              without pushing your source code to the cloud.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button href={downloadUrl} rel="noreferrer" target="_blank">
                Download App
                <ArrowRight className="size-4" />
              </Button>
              <Button href="/pricing" variant="secondary">
                View Pricing
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted">
              <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                Your code stays on your machine.
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                LaunchStack never uploads your source code.
              </div>
            </div>
          </div>

          <Card className="hero-shine overflow-hidden">
            <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-muted">
                    Active workspace
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    launchstack-desktop
                  </div>
                </div>
                <span className="rounded-full bg-emerald/16 px-3 py-1 text-xs font-semibold text-emerald">
                  Ready to launch
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <div className="flex items-center gap-3 text-sm text-white">
                    <FolderKanban className="size-4 text-brand" />
                    Smart folder detected
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    React frontend, Electron shell, Firebase backend helpers, and a
                    saved “Run full stack” profile.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <div className="flex items-center gap-3 text-sm text-white">
                    <TerminalSquare className="size-4 text-emerald" />
                    Launch profile
                  </div>
                  <div className="mt-3 space-y-2 font-mono text-xs text-muted-strong">
                    <div className="rounded-xl bg-slate-950/80 px-3 py-2">
                      open VS Code
                    </div>
                    <div className="rounded-xl bg-slate-950/80 px-3 py-2">
                      npm run dev:web
                    </div>
                    <div className="rounded-xl bg-slate-950/80 px-3 py-2">
                      npm run dev:desktop
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-brand/16 via-white/6 to-emerald/10 p-4">
                  <div className="flex items-center gap-3 text-sm text-white">
                    <Workflow className="size-4 text-brand" />
                    Billing-aware sync
                  </div>
                  <p className="mt-2 text-sm text-muted-strong">
                    Pro access is verified securely through the LaunchStack billing
                    backend before premium desktop features unlock.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <div className="text-sm uppercase tracking-[0.2em] text-muted">
              Problem
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Dev environments start from muscle memory instead of a reliable workflow.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              Teams lose time reopening editors, terminals, scripts, and stack-specific
              commands every time they jump between repos.
            </p>
          </Card>
          <Card>
            <div className="text-sm uppercase tracking-[0.2em] text-muted">
              Solution
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              LaunchStack saves the “right way to start” for every local project.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              Keep launch behavior close to your machine, your editors, and your actual
              folders. Start work fast without surrendering local control.
            </p>
          </Card>
          <Card>
            <div className="text-sm uppercase tracking-[0.2em] text-muted">
              Security
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Trust built around local-first defaults.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              LaunchStack never uploads your source code. Payments and subscriptions are
              handled securely through Dodo Payments.
            </p>
          </Card>
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="max-w-2xl">
          <div className="eyebrow">Features</div>
          <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
            Built for developers who want speed without losing local control.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => (
            <Card key={feature.title}>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <div className="eyebrow">How It Works</div>
            <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
              Save once. Launch the same way every time.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted">
              LaunchStack combines project discovery, editor handoff, and command
              orchestration into a fast local workflow that feels purpose-built for
              developer machines.
            </p>
          </div>
          <div className="space-y-4">
            {workflowSteps.map((step) => (
              <Card key={step.title}>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald">
              <Shield className="size-4" />
              Security / Local-first
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-muted">
              <li className="flex gap-3">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald" />
                <span>Your code stays on your machine.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald" />
                <span>LaunchStack never uploads your source code.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald" />
                <span>
                  Google sign-in and Apple sign-in are used only for account and
                  subscription sync.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald" />
                <span>
                  Payments and subscriptions are handled securely through Dodo
                  Payments.
                </span>
              </li>
            </ul>
          </Card>

          <Card>
            <div className="text-sm uppercase tracking-[0.2em] text-muted">
              Pricing preview
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-white">Free</div>
                    <div className="text-sm text-muted">For personal local workflows</div>
                  </div>
                  <div className="text-2xl font-semibold text-white">$0</div>
                </div>
              </div>
              <div className="rounded-2xl border border-brand/40 bg-brand/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-white">Pro</div>
                    <div className="text-sm text-muted-strong">
                      Unlimited projects and advanced presets
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-white">$12/mo</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-brand">
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
          <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
            Questions teams ask before rolling LaunchStack into their workflow.
          </h2>
        </div>
        <div className="mt-8 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="glass-panel surface-outline rounded-3xl p-6"
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
