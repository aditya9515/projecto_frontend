import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  ...cardProps
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "projecto-card surface-outline card-hover rounded-[10px] border border-border bg-card p-6 text-foreground sm:p-8",
        className,
      )}
      {...cardProps}
    >
      {children}
    </div>
  );
}
