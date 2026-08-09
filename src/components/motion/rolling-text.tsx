import { cn } from "@/lib/utils";

export function RollingText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={cn("rolling-window", className)}>
      <span className="rolling-track">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
    </span>
  );
}
