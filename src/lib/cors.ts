import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseAllowedOrigins } from "@/lib/env";

export function resolveDesktopAllowedOrigin(
  requestOrigin: string | null,
  appBaseUrl: string,
  configuredOrigins?: string,
) {
  if (!requestOrigin) {
    return null;
  }

  const allowlist = new Set([
    new URL(appBaseUrl).origin,
    ...parseAllowedOrigins(configuredOrigins),
  ]);

  return allowlist.has(requestOrigin) ? requestOrigin : null;
}

export function buildDesktopCorsHeaders(origin: string | null) {
  const headers = new Headers({
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  });

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

export function ensureDesktopOrigin(
  request: NextRequest,
  appBaseUrl: string,
  configuredOrigins?: string,
) {
  const origin = request.headers.get("origin");
  const allowedOrigin = resolveDesktopAllowedOrigin(
    origin,
    appBaseUrl,
    configuredOrigins,
  );

  if (origin && !allowedOrigin) {
    throw new Error("Origin not allowed");
  }

  return allowedOrigin;
}

export function desktopOptionsResponse(
  request: NextRequest,
  appBaseUrl: string,
  configuredOrigins?: string,
) {
  const origin = request.headers.get("origin");
  const allowedOrigin = resolveDesktopAllowedOrigin(
    origin,
    appBaseUrl,
    configuredOrigins,
  );

  if (origin && !allowedOrigin) {
    return NextResponse.json(
      { error: "Origin not allowed" },
      { status: 403 },
    );
  }

  return new NextResponse(null, {
    status: 204,
    headers: buildDesktopCorsHeaders(allowedOrigin),
  });
}
