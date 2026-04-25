import type { DecodedIdToken } from "firebase-admin/auth";

import { getAppRuntimeEnv } from "@/lib/env";
import {
  consumeDesktopAuthToken,
  createDesktopAuthToken,
  createDesktopSession,
  getDesktopAuthToken,
  getUserProfile,
  listSubscriptionsForUser,
  upsertUserProfile,
} from "@/lib/firestore";
import {
  addDays,
  addMinutes,
  createOpaqueToken,
  isExpired,
  nowIso,
  sha256,
} from "@/lib/security";
import {
  normalizeSubscription,
  selectPrimarySubscription,
  withPlanEntitlements,
} from "@/lib/subscriptions";
import type {
  AppSubscriptionSnapshot,
  DesktopCallbackPayload,
  DesktopPlatform,
  DesktopSessionRecord,
  UserProfileRecord,
} from "@/lib/types";

export class DesktopAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "DesktopAuthError";
  }
}

type DesktopExchangeInput = {
  code: string;
  state?: string;
  deviceId: string;
  deviceName?: string;
  platform: DesktopPlatform;
};

type DesktopExchangeResult = {
  accessToken: string;
  desktopSessionToken: string;
  user: {
    uid: string;
    email: string;
    name: string;
  };
  subscription: AppSubscriptionSnapshot & {
    active: true;
  };
};

async function loadDesktopSubscriptionAccess(userId: string) {
  return withPlanEntitlements(
    normalizeSubscription(
      selectPrimarySubscription(await listSubscriptionsForUser(userId)),
    ),
  );
}

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

  console.info("[desktop-auth] issued desktop callback code", {
    uid: decoded.uid,
    expiresAt,
  });

  return {
    code,
    state,
    expiresAt,
    redirectUrl: `${DESKTOP_PROTOCOL}auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
  };
}

export async function exchangeDesktopCallbackCode(
  input: DesktopExchangeInput,
): Promise<DesktopExchangeResult> {
  const codeHash = sha256(input.code);
  const tokenRecord = await getDesktopAuthToken(codeHash);

  if (!tokenRecord) {
    throw new DesktopAuthError(
      "Desktop auth code is invalid.",
      401,
      "desktop_auth_invalid",
    );
  }

  if (tokenRecord.stateHash) {
    if (!input.state || sha256(input.state) !== tokenRecord.stateHash) {
      throw new DesktopAuthError(
        "Desktop auth state does not match.",
        401,
        "desktop_auth_state_mismatch",
      );
    }
  }

  if (tokenRecord.used) {
    throw new DesktopAuthError(
      "Desktop auth code has already been used.",
      409,
      "desktop_auth_used",
    );
  }

  if (isExpired(tokenRecord.expiresAt)) {
    throw new DesktopAuthError(
      "Desktop auth code has expired.",
      410,
      "desktop_auth_expired",
    );
  }

  const [profile, subscription] = await Promise.all([
    getUserProfile(tokenRecord.userId),
    loadDesktopSubscriptionAccess(tokenRecord.userId),
  ]);

  if (!profile?.email) {
    throw new DesktopAuthError(
      "User profile was not found for this desktop login.",
      404,
      "desktop_auth_user_not_found",
    );
  }

  const consumed = await consumeDesktopAuthToken(codeHash);

  if (!consumed) {
    throw new DesktopAuthError(
      "Desktop auth code has already been used.",
      409,
      "desktop_auth_used",
    );
  }

  const accessToken = createOpaqueToken();
  const accessTokenHash = sha256(accessToken);
  const issuedAt = nowIso();
  const sessionRecord: DesktopSessionRecord = {
    id: accessTokenHash,
    userId: tokenRecord.userId,
    deviceId: input.deviceId,
    deviceName: input.deviceName?.trim() || "Projecto Desktop",
    platform: input.platform,
    tokenHash: accessTokenHash,
    createdAt: issuedAt,
    lastSeenAt: issuedAt,
    expiresAt: addDays(30),
    revoked: false,
  };

  await createDesktopSession(sessionRecord);

  console.info("[desktop-auth] exchanged desktop callback code", {
    uid: tokenRecord.userId,
    deviceId: sessionRecord.deviceId,
    platform: sessionRecord.platform,
  });

  return {
    accessToken,
    desktopSessionToken: accessToken,
    user: {
      uid: tokenRecord.userId,
      email: profile.email,
      name: profile.displayName,
    },
    subscription: {
      ...subscription,
      active: true,
    },
  };
}
