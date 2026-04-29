"use client";

import Link from "next/link";
import { Command, Download, LogOut } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Button } from "@/components/ui/button";
import { getOptionalAppConfig } from "@/lib/env";
import { initialsFromName } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const { downloadUrl } = getOptionalAppConfig();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/78 backdrop-blur-2xl">
      <div className="section-shell flex min-h-20 items-center justify-between gap-4">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex size-11 items-center justify-center rounded-2xl border border-border bg-card-strong text-foreground">
            <Command className="size-5" />
          </span>
          <div>
            <div className="text-base font-semibold tracking-tight text-foreground">Projecto</div>
            <div className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-muted">
              Developer workspace launcher
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className="transition hover:text-foreground"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Button
            className="hidden sm:inline-flex"
            href={downloadUrl}
            rel="noreferrer"
            target="_blank"
            variant="secondary"
          >
            <Download className="size-4" />
            Download App
          </Button>

          {loading ? (
            <div className="h-11 w-28 rounded-full border border-border bg-card" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                aria-label="Open account"
                className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-strong transition hover:bg-card-strong hover:text-foreground"
                href="/account"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                  {initialsFromName(user.displayName, user.email)}
                </span>
              </Link>
              <button
                className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-strong transition hover:bg-card-strong hover:text-foreground"
                onClick={() => void signOut()}
                type="button"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Button href="/login" variant="secondary">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
