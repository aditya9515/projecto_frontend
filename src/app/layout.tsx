import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "projecto",
    template: "%s | projecto",
  },
  description: "Open and run any dev project in one click.",
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "projecto",
    description: "Open and run any dev project in one click.",
    siteName: "projecto",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "projecto",
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
      className={`${manrope.variable} ${ibmPlexMono.variable} h-full scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <Providers>
          <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
            <div className="page-ambient pointer-events-none absolute inset-0 -z-20" />
            <div className="hairline-grid pointer-events-none absolute inset-0 -z-10 opacity-55" />
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
