"use client";

import type { User } from "firebase/auth";

import type { AuthSyncPayload } from "@/lib/types";
import { authorizedFetch, readApiResponse } from "@/lib/client-api";

function uniqueProviders(user: User) {
  return Array.from(new Set(user.providerData.map((item) => item.providerId)));
}

const pendingSyncs = new Map<string, Promise<unknown>>();

export function syncFirebaseUser(user: User) {
  const pending = pendingSyncs.get(user.uid);
  if (pending) return pending;
  const sync = syncUser(user).finally(() => { pendingSyncs.delete(user.uid); });
  pendingSyncs.set(user.uid, sync);
  return sync;
}

async function syncUser(user: User) {
  const payload: AuthSyncPayload = {
    ...(user.email ? { email: user.email } : {}),
    displayName: user.displayName ?? user.email ?? "projecto user",
    photoURL: user.photoURL ?? null,
    providers: uniqueProviders(user),
  };

  const response = await authorizedFetch(user, "/api/auth/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readApiResponse(response, "Unable to sync your account right now. Please try again.");
}
