import { getDesktopSession, touchDesktopSession } from "@/lib/firestore";
import { isExpired, sha256 } from "@/lib/security";
import type { DesktopSessionRecord } from "@/lib/types";

export class DesktopSessionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "DesktopSessionError";
  }
}

export async function requireDesktopSession(input: {
  desktopSessionToken: string;
  deviceId: string;
}): Promise<DesktopSessionRecord> {
  const sessionHash = sha256(input.desktopSessionToken);
  const session = await getDesktopSession(sessionHash);

  if (
    !session ||
    session.revoked ||
    isExpired(session.expiresAt) ||
    session.deviceId !== input.deviceId
  ) {
    throw new DesktopSessionError(
      "Desktop session is invalid or expired.",
      401,
      "desktop_session_invalid",
    );
  }

  await touchDesktopSession(sessionHash);
  return session;
}
