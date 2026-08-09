"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, Download, LogOut, Menu, X } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { RollingText } from "@/components/motion/rolling-text";
import { Button } from "@/components/ui/button";
import { getOptionalAppConfig } from "@/lib/env";
import { cn, initialsFromName } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/#demo", label: "Demo" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const { downloadUrl } = getOptionalAppConfig();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-1 z-40 border-b border-border-strong bg-background/95 backdrop-blur-md max-sm:top-0.5">
      <div className="section-shell flex min-h-[76px] items-center justify-between gap-3">
        <Link className="group flex min-w-0 items-center gap-3" href="/">
          <span className="projecto-icon-surface relative flex size-10 shrink-0 items-center justify-center rounded-[6px] border transition-transform duration-300 group-hover:-rotate-3">
            <Command className="size-5" />
            <span className="absolute -right-1 -top-1 size-2.5 rounded-full border border-foreground bg-brand" />
          </span>
          <div className="min-w-0">
            <div className="text-base font-semibold tracking-[-0.03em] text-foreground">
              Projecto
            </div>
            <div className="hidden font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted sm:block xl:hidden 2xl:block">
              Local workspace launcher
            </div>
          </div>
        </Link>

        <nav className="hidden items-center rounded-[6px] border border-border-strong bg-card p-1 lg:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href.startsWith("/#")
                  ? false
                  : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                className={cn(
                  "rolling-link rounded-[3px] px-4 py-2 font-mono text-[0.68rem] font-medium uppercase tracking-[0.08em] transition-colors",
                  active
                    ? "bg-foreground text-[#f1f1f1]"
                    : "text-muted-strong hover:bg-card-strong hover:text-foreground",
                )}
                href={item.href}
              >
                <RollingText>{item.label}</RollingText>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            className="hidden xl:inline-flex"
            href={downloadUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Download className="size-4" />
            <RollingText>Download</RollingText>
          </Button>

          {loading ? (
            <div className="h-12 w-24 rounded-[6px] border border-border bg-card" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                aria-label="Open account"
                className="inline-flex size-12 items-center justify-center rounded-[6px] border border-border-strong bg-card font-mono text-xs font-semibold transition hover:bg-foreground hover:text-[#f1f1f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                href="/account"
              >
                {initialsFromName(user.displayName, user.email)}
              </Link>
              <button
                aria-label="Log out"
                className="hidden size-12 items-center justify-center rounded-[6px] border border-border-strong bg-card transition hover:bg-foreground hover:text-[#f1f1f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:inline-flex"
                onClick={() => void signOut()}
                type="button"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Button href="/login" variant="secondary">
              <RollingText>Sign in</RollingText>
            </Button>
          )}

          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="inline-flex size-12 items-center justify-center rounded-[6px] border border-border-strong bg-card transition hover:bg-foreground hover:text-[#f1f1f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="absolute left-0 right-0 top-full border-b border-border-strong bg-background px-5 py-4 lg:hidden">
          <nav className="mx-auto grid max-w-[1440px] gap-2">
            {navItems.map((item, index) => (
              <Link
                className="flex items-center justify-between rounded-[6px] border border-border bg-card px-4 py-3 font-mono text-xs uppercase tracking-[0.08em] transition hover:border-border-strong"
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
              >
                <span>{item.label}</span>
                <span className="text-muted">0{index + 1}</span>
              </Link>
            ))}
            <Button className="mt-2 w-full" href={downloadUrl} target="_blank">
              <Download className="size-4" />
              Download Projecto
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
