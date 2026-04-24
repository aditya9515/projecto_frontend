import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/6 py-10">
      <div className="section-shell flex flex-col gap-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-emerald">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <div className="font-semibold text-white">LaunchStack</div>
            <div>Your code stays on your machine.</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <Link className="transition hover:text-white" href="/">
            Overview
          </Link>
          <Link className="transition hover:text-white" href="/pricing">
            Pricing
          </Link>
          <Link className="transition hover:text-white" href="/login">
            Login
          </Link>
          <Link className="transition hover:text-white" href="/account">
            Account
          </Link>
        </div>
      </div>
    </footer>
  );
}
