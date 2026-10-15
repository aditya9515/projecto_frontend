import { NextResponse } from "next/server";
import { getLatestWindowsInstaller } from "@/lib/latest-release";

export const runtime = "nodejs";

export async function GET() {
  try {
    const installer = await getLatestWindowsInstaller();
    const asset = await fetch(`https://api.github.com/repos/aditya9515/Projecto/releases/assets/${installer.assetId}`, {
      headers: { Accept: "application/octet-stream", "User-Agent": "Projecto-Website" },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (asset.status === 200 && asset.headers.get("Content-Type")?.startsWith("application/octet-stream")) {
      return new NextResponse(asset.body, { headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(installer.fileName)}`,
        "Cache-Control": "no-store",
      } });
    }
    const location = asset.headers.get("Location");
    if (![302, 307].includes(asset.status) || !location) throw new Error("Installer download unavailable.");
    const downloadUrl = new URL(location);
    if (downloadUrl.origin !== "https://release-assets.githubusercontent.com" || downloadUrl.username || downloadUrl.password) {
      throw new Error("Invalid installer download destination.");
    }
    return new NextResponse(null, {
      status: 302,
      headers: { Location: downloadUrl.href, "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "The latest download is temporarily unavailable. Please try again shortly." }, {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "60" },
    });
  }
}
