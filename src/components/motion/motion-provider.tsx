"use client";

import { useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function MotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const runAnimations = () => {
        const root = scope.current;
        if (!root) {
          return;
        }

        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        const revealTargets = gsap.utils.toArray<HTMLElement>(
          "[data-reveal], .reveal-1, .reveal-2, .reveal-3",
          root,
        );
        const heroLines = gsap.utils.toArray<HTMLElement>(
          "[data-hero-line]",
          root,
        );
        const lineTargets = gsap.utils.toArray<HTMLElement>(
          "[data-line-reveal]",
          root,
        );

        if (reducedMotion) {
          gsap.set([...revealTargets, ...heroLines, ...lineTargets], {
            clearProps: "all",
          });
          return;
        }

        const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        heroTimeline
          .from("[data-hero-meta]", {
            autoAlpha: 0,
            duration: 0.55,
            y: 14,
          })
          .from(
            heroLines,
            {
              duration: 0.9,
              stagger: 0.08,
              yPercent: 112,
            },
            "-=0.25",
          )
          .from(
            "[data-hero-support]",
            {
              autoAlpha: 0,
              duration: 0.75,
              stagger: 0.08,
              y: 22,
            },
            "-=0.45",
          );

        const hero = root.querySelector("[data-hero]");

        revealTargets.forEach((element) => {
          if (hero?.contains(element)) {
            return;
          }

          gsap.fromTo(
            element,
            { autoAlpha: 0, y: 34 },
            {
              autoAlpha: 1,
              duration: 0.85,
              ease: "power3.out",
              scrollTrigger: {
                once: true,
                start: "top 88%",
                trigger: element,
              },
              y: 0,
            },
          );
        });

        lineTargets.forEach((element) => {
          gsap.fromTo(
            element,
            { scaleX: 0 },
            {
              duration: 0.9,
              ease: "power3.inOut",
              scaleX: 1,
              scrollTrigger: {
                once: true,
                start: "top 92%",
                trigger: element,
              },
              transformOrigin: "left center",
            },
          );
        });

        ScrollTrigger.refresh();
      };

      const animationFrame = window.requestAnimationFrame(
        contextSafe ? contextSafe(runAnimations) : runAnimations,
      );

      return () => window.cancelAnimationFrame(animationFrame);
    },
    { dependencies: [pathname], revertOnUpdate: true, scope },
  );

  return <div ref={scope}>{children}</div>;
}
