import Link from "next/link";
import { ArrowUpRight, Command } from "lucide-react";

import { RollingText } from "@/components/motion/rolling-text";

export function SiteFooter() {
  return (
    <footer className="dark-field noise-field border-t border-[#3a3a37] py-10 sm:py-14">
      <div className="section-shell">
        <div className="grid gap-10 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-[6px] border border-brand bg-brand text-foreground">
                <Command className="size-5" />
              </span>
              <span className="text-2xl font-semibold tracking-[-0.04em]">Projecto</span>
            </div>
            <p className="mt-6 max-w-2xl text-3xl font-medium leading-[1.05] tracking-[-0.04em] sm:text-5xl">
              Your code stays on your machine.
            </p>
          </div>

          <nav className="grid gap-2 font-mono text-xs uppercase tracking-[0.08em] md:justify-self-end">
            {[
              ["Overview", "/"],
              ["Demo", "/#demo"],
              ["Pricing", "/pricing"],
              ["Sign in", "/login"],
            ].map(([label, href]) => (
              <Link
                className="rolling-link flex min-w-44 items-center justify-between border-b border-[#3a3a37] py-3 text-[#d8d8d2] transition hover:border-brand hover:text-brand"
                href={href}
                key={href}
              >
                <RollingText>{label}</RollingText>
                <ArrowUpRight className="size-4" />
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#3a3a37] pt-5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-[#92928d] sm:flex-row sm:items-center sm:justify-between">
          <span>Projecto / Local-first developer workspace</span>
          <span>Account and billing sync only / No source uploads</span>
        </div>
      </div>
    </footer>
  );
}
