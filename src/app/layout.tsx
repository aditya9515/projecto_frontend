import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";

import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "LaunchStack",
    template: "%s | LaunchStack",
  },
  description: "Open and run any dev project in one click.",
  metadataBase: new URL("https://launchstack.app"),
  openGraph: {
    title: "LaunchStack",
    description: "Open and run any dev project in one click.",
    siteName: "LaunchStack",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LaunchStack",
    description: "Open and run any dev project in one click.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${ibmPlexMono.variable} h-full scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <Providers>
          <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_48%),radial-gradient(circle_at_20%_20%,_rgba(168,85,247,0.2),_transparent_36%),radial-gradient(circle_at_80%_0%,_rgba(16,185,129,0.14),_transparent_30%)]" />
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_18%,_rgba(12,17,29,0.28)_100%)]" />
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
