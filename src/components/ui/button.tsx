import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const buttonStyles = {
  primary:
    "projecto-inverse-text border border-emerald bg-foreground shadow-[0_14px_32px_rgba(82,171,152,0.16)] hover:bg-muted-strong hover:shadow-[0_20px_40px_rgba(82,171,152,0.22)]",
  secondary:
    "border border-border bg-card text-foreground hover:border-border-strong hover:bg-card-strong",
  ghost:
    "text-muted-strong hover:bg-card hover:text-foreground",
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
      "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-[0.04em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong disabled:cursor-not-allowed disabled:border-border-strong disabled:bg-card disabled:text-foreground",
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
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-[0.04em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong disabled:cursor-not-allowed disabled:border-border-strong disabled:bg-card disabled:text-foreground",
    buttonStyles[variant],
    className,
  );

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
