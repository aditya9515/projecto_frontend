"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Card } from "@/components/ui/card";
import type { ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const themeOptions: Array<{
  value: ThemeMode;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  {
    value: "light",
    label: "Light",
    description: "Bright monochrome surfaces with softer contrast.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "A deeper monochrome workspace for lower-glare browsing.",
    icon: Moon,
  },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="reveal-2">
      <div className="account-label">Appearance</div>
      <div className="mt-4 max-w-2xl text-sm leading-7 text-muted">
        Choose the monochrome interface you want for Projecto on this browser.
        The theme updates instantly and stays saved for future visits.
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const active = theme === option.value;

          return (
            <button
              aria-pressed={active}
              className={cn("theme-option", active ? "shadow-none" : "")}
              data-active={active}
              key={option.value}
              onClick={() => setTheme(option.value)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                  <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-current/10 bg-current/5">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{option.label}</div>
                    <div className="theme-option-muted mt-2 text-sm leading-6">
                      {option.description}
                    </div>
                  </div>
                </div>
                <span className="account-label">
                  {active ? "Active" : "Select"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
