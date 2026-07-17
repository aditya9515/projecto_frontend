import { ExternalLink, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PROJECTO_DEMO_VIDEO } from "@/lib/demo-video";

export function DemoVideoSection() {
  return (
    <section id="demo" className="section-shell py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <Card className="reveal-1 h-full">
          <div className="eyebrow">
            <PlayCircle className="size-4" />
            Demo Video
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            Watch Projecto manage a local workspace.
          </h2>
          <p className="mt-5 text-base leading-8 text-muted">
            This walkthrough shows the desktop flow end to end: import a local project,
            detect its stack, launch it through the mapped Windows terminal, parse the
            app URL, track the running port, and stop the session from Projecto.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/download">Download App</Button>
            <Button href={PROJECTO_DEMO_VIDEO.href} target="_blank" variant="secondary">
              Open Video
              <ExternalLink className="size-4" />
            </Button>
          </div>
        </Card>

        <div className="reveal-2 overflow-hidden rounded-[2rem] border border-border bg-card p-3 text-foreground">
          <video
            className="aspect-video w-full rounded-[1.4rem] border border-border bg-background object-cover"
            controls
            poster={PROJECTO_DEMO_VIDEO.poster}
            preload="metadata"
          >
            <source src={PROJECTO_DEMO_VIDEO.href} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="flex flex-col gap-2 px-2 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>{PROJECTO_DEMO_VIDEO.title}</span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-strong">
              3 min 53 sec
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}