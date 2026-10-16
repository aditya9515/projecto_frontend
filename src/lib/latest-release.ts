import { z } from "zod";
import type { WindowsInstallerMetadata } from "@/lib/desktop-update";

const releaseSchema = z.object({
  tag_name: z.string().min(1),
  draft: z.literal(false),
  prerelease: z.literal(false),
  assets: z.array(z.object({
    id: z.number().int().positive(),
    name: z.string(),
    state: z.string(),
    size: z.number().positive(),
    browser_download_url: z.string().url(),
    digest: z.string().nullable().optional(),
  })),
});

export async function getLatestWindowsInstaller(): Promise<WindowsInstallerMetadata & { assetId: number }> {
  const response = await fetch("https://api.github.com/repos/aditya9515/Projecto/releases/latest", {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "Projecto-Website" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Unable to retrieve the latest Projecto release.");

  const release = releaseSchema.parse(await response.json());
  const version = release.tag_name.replace(/^v/i, "");
  const expectedName = `Projecto-${version}.Setup.exe`;
  const asset = release.assets.find((item) => item.state === "uploaded" && item.name === expectedName);
  if (!asset) throw new Error("The latest release does not have a Windows installer yet.");

  const url = new URL(asset.browser_download_url);
  if (url.origin !== "https://github.com" || !url.pathname.startsWith("/aditya9515/Projecto/releases/download/") || url.username || url.password) {
    throw new Error("The release installer URL is invalid.");
  }
  return {
    assetId: asset.id,
    href: url.href,
    fileName: asset.name,
    version,
    size: `${(asset.size / 1_000_000).toFixed(1)} MB`,
    sha256: asset.digest?.startsWith("sha256:") ? asset.digest.slice(7) : "Not provided for this release",
  };
}
