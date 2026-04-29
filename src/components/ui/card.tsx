import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-panel surface-outline card-hover rounded-[2rem] p-6 text-foreground sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
