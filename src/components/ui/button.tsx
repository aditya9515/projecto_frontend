import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const buttonStyles = {
  primary:
    "bg-brand-strong text-black shadow-[0_16px_44px_rgba(255,255,255,0.08)] hover:bg-zinc-200",
  secondary:
    "border border-border-strong bg-white/4 text-foreground hover:bg-white/9",
  ghost:
    "text-muted-strong hover:bg-white/5 hover:text-white",
};

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
      "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-[0.04em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
      buttonStyles[variant],
      className,
    );
    const isExternal = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(href);

    if (isExternal) {
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
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-[0.04em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
    buttonStyles[variant],
    className,
  );

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
