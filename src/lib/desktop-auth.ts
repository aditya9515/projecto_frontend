import type { DecodedIdToken } from "firebase-admin/auth";

import { getAppRuntimeEnv } from "@/lib/env";
import { createDesktopAuthToken, getUserProfile, upsertUserProfile } from "@/lib/firestore";
import { addMinutes, createOpaqueToken, nowIso, sha256 } from "@/lib/security";
import type { DesktopCallbackPayload, UserProfileRecord } from "@/lib/types";

async function ensureDesktopAuthUserProfile(decoded: DecodedIdToken) {
  const existing = await getUserProfile(decoded.uid);
  const email = existing?.email ?? decoded.email;

  if (!email) {
    throw new Error("Authenticated account is missing an email address.");
  }

  if (existing) {
    return existing;
  }

  const now = nowIso();
  const fallbackProfile: UserProfileRecord = {
    uid: decoded.uid,
    email,
    displayName: decoded.name ?? email.split("@")[0],
    photoURL: decoded.picture ?? null,
    providers: [decoded.firebase.sign_in_provider],
    createdAt: now,
    updatedAt: now,
  };

  await upsertUserProfile(fallbackProfile);
  return fallbackProfile;
}

export async function issueDesktopAuthToken(decoded: DecodedIdToken) {
  await ensureDesktopAuthUserProfile(decoded);

  const token = createOpaqueToken();
  const tokenHash = sha256(token);
  const expiresAt = addMinutes(5);

  await createDesktopAuthToken({
    id: tokenHash,
    userId: decoded.uid,
    tokenHash,
    stateHash: null,
    expiresAt,
    used: false,
    createdAt: nowIso(),
  });

  return { token, expiresAt };
}

export async function issueDesktopCallbackPayload(
  decoded: DecodedIdToken,
): Promise<DesktopCallbackPayload> {
  await ensureDesktopAuthUserProfile(decoded);

  const code = createOpaqueToken();
  const state = createOpaqueToken(16);
  const codeHash = sha256(code);
  const stateHash = sha256(state);
  const expiresAt = addMinutes(5);
  const { DESKTOP_PROTOCOL } = getAppRuntimeEnv();

  await createDesktopAuthToken({
    id: codeHash,
    userId: decoded.uid,
    tokenHash: codeHash,
    stateHash,
    expiresAt,
    used: false,
    createdAt: nowIso(),
  });

  return {
    code,
    state,
    expiresAt,
    redirectUrl: `${DESKTOP_PROTOCOL}auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
  };
}
