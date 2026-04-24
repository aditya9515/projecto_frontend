import { createHash, randomBytes } from "node:crypto";

export function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function nowIso(date = new Date()) {
  return date.toISOString();
}

export function addMinutes(minutes: number, reference = new Date()) {
  return new Date(reference.getTime() + minutes * 60_000).toISOString();
}

export function addDays(days: number, reference = new Date()) {
  return new Date(reference.getTime() + days * 24 * 60 * 60_000).toISOString();
}

export function isExpired(expiresAt: string, reference = new Date()) {
  const expiry = Date.parse(expiresAt);
  return Number.isNaN(expiry) || expiry <= reference.getTime();
}
