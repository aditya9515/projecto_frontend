"use client";

import type { User } from "firebase/auth";

export async function authorizedFetch(
  user: User,
  input: string,
  init?: RequestInit,
) {
  const token = await user.getIdToken();

  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
