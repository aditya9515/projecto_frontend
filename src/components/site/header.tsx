"use client";

import Link from "next/link";
import { Command, Download, LayoutDashboard, LogOut } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { getOptionalAppConfig } from "@/lib/env";
import { initialsFromName } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/pricing", label: "Pricing" },
  { href: "/account", label: "Account" },
];

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const { downloadUrl } = getOptionalAppConfig();

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-black/45 backdrop-blur-2xl">
      <div className="section-shell flex min-h-20 items-center justify-between gap-4">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex size-11 items-center justify-center rounded-2xl border border-white/12 bg-white/5 text-white">
            <Command className="size-5" />
          </span>
          <div>
            <div className="text-base font-semibold tracking-tight">projecto</div>
            <div className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-muted">
              Local launch control
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className="transition hover:text-white"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
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
            <div className="h-11 w-28 rounded-full border border-white/10 bg-white/4" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                className="hidden items-center gap-3 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-sm text-muted-strong transition hover:bg-white/8 md:flex"
                href="/account"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                  {initialsFromName(user.displayName, user.email)}
                </span>
                <span className="max-w-44 truncate">
                  {user.displayName ?? user.email}
                </span>
              </Link>
              <Button href="/account" variant="secondary">
                <LayoutDashboard className="size-4" />
                <span className="hidden sm:inline">Account</span>
              </Button>
              <button
                className="inline-flex size-11 items-center justify-center rounded-full border border-white/12 bg-white/5 text-muted-strong transition hover:bg-white/8 hover:text-white"
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
