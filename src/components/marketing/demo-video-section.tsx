import { ArrowUpRight, Play } from "lucide-react";

import { RollingText } from "@/components/motion/rolling-text";
import { Button } from "@/components/ui/button";
import { PROJECTO_DEMO_VIDEO } from "@/lib/demo-video";

export function DemoVideoSection() {
  return (
    <section className="border-b border-border-strong bg-card-strong py-16 sm:py-24" id="demo">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
        <div data-reveal>
          <div className="eyebrow">
            <Play className="size-3.5 fill-current" />
            Product walkthrough
          </div>
          <h2 className="mt-7 max-w-xl text-4xl font-medium leading-[0.96] tracking-[-0.055em] sm:text-6xl">
            See a local workspace go from folder to running app.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-8 text-muted">
            Import a project, detect its stack, launch it through Windows Terminal,
            parse the app URL, track the port, and stop the session from Projecto.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/download">
              <RollingText>Download app</RollingText>
            </Button>
            <Button href={PROJECTO_DEMO_VIDEO.href} target="_blank" variant="secondary">
              <RollingText>Open video</RollingText>
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-border-strong bg-foreground p-2" data-reveal>
          <video
            className="aspect-video w-full rounded-[5px] bg-[#0c0c0c] object-cover"
            controls
            poster={PROJECTO_DEMO_VIDEO.poster}
            preload="metadata"
          >
            <source src={PROJECTO_DEMO_VIDEO.href} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="flex flex-col gap-2 px-2 py-3 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-[#aaa9a3] sm:flex-row sm:items-center sm:justify-between">
            <span>{PROJECTO_DEMO_VIDEO.title}</span>
            <span>03:53 / Local workflow</span>
          </div>
        </div>
      </div>
    </section>
  );
}
