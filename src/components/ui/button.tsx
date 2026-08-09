import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const buttonStyles = {
  primary:
    "border border-brand bg-brand text-foreground hover:border-foreground hover:bg-foreground hover:text-[#f1f1f1]",
  secondary:
    "border border-border-strong bg-transparent text-foreground hover:bg-foreground hover:text-[#f1f1f1]",
  ghost:
    "border border-transparent text-muted-strong hover:border-border hover:bg-card hover:text-foreground",
};

const sharedButtonStyles =
  "group/button inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-[6px] px-5 py-3 font-mono text-xs font-medium uppercase tracking-[0.08em] transition-[color,background-color,border-color,transform] duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

interface CommonButtonProps {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof buttonStyles;
}

type ButtonProps = CommonButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkButtonProps = CommonButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function Button(props: ButtonProps | LinkButtonProps) {
  if ("href" in props && typeof props.href === "string") {
    const {
      href,
      children,
      className,
      variant = "primary",
      ...linkProps
    } = props as LinkButtonProps;
    const classes = cn(
      sharedButtonStyles,
      buttonStyles[variant],
      className,
    );
    const isExternal = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(href);
    const shouldUseAnchor =
      isExternal || linkProps.download != null || href.startsWith("/downloads/");

    if (shouldUseAnchor) {
      return (
        <a className={classes} href={href} {...linkProps}>
          {children}
        </a>
      );
    }

    return (
      <Link className={classes} href={href} {...linkProps}>
        {children}
      </Link>
    );
  }

  const {
    children,
    className,
    variant = "primary",
    ...buttonProps
  } = props as ButtonProps;
  const classes = cn(
    sharedButtonStyles,
    buttonStyles[variant],
    className,
  );

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
