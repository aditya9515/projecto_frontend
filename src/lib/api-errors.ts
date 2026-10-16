import { NextResponse } from "next/server";
import { z } from "zod";

export function apiErrorResponse(error: unknown, fallback: string, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "no-store");
  let status = 500;
  let payload: { error: string; code?: string; details?: unknown } = { error: fallback };
  if (error instanceof Error && error.message === "Unauthorized") {
    status = 401;
    payload = { error: "Unauthorized" };
  } else if (error instanceof Error && error.message === "Origin not allowed") {
    status = 403;
    payload = { error: "Origin not allowed" };
  } else if (error instanceof z.ZodError) {
    status = 400;
    payload = { error: "Invalid request payload.", details: error.flatten() };
  } else if (error instanceof SyntaxError) {
    status = 400;
    payload = { error: "Request body must contain valid JSON." };
  } else if (error instanceof Error && ["DesktopAuthError", "DesktopSessionError", "ProjectDirectoryError"].includes(error.name)) {
    const domainError = error as Error & { status: number; code: string };
    status = domainError.status;
    payload = { error: error.message, code: domainError.code };
  } else {
    console.error("[api] request failed", { message: fallback, code: (error as { code?: string } | null)?.code });
  }
  return NextResponse.json(payload, { status, headers: responseHeaders });
}
