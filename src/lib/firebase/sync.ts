"use client";

import type { User } from "firebase/auth";

import type { AuthSyncPayload } from "@/lib/types";

function uniqueProviders(user: User) {
  return Array.from(new Set(user.providerData.map((item) => item.providerId)));
}

export async function syncFirebaseUser(user: User) {
  const idToken = await user.getIdToken();
  const payload: AuthSyncPayload = {
    email: user.email ?? "",
    displayName: user.displayName ?? user.email ?? "LaunchStack User",
    photoURL: user.photoURL ?? null,
    providers: uniqueProviders(user),
  };

  const response = await fetch("/api/auth/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Unable to sync your account right now.");
  }

  return response.json();
}
