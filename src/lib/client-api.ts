"use client";

import type { User } from "firebase/auth";

export async function authorizedFetch(
  user: User,
  input: string,
  init?: RequestInit,
) {
  const send = async (refresh: boolean) => {
    const token = await user.getIdToken(refresh);
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, cache: "no-store", headers });
  };
  const response = await send(false);
  return response.status === 401 ? send(true) : response;
}

export async function readApiResponse<T>(response: Response, fallback: string): Promise<T> {
  let payload: T & { error?: string };
  try {
    payload = await response.json();
  } catch {
    throw new Error(fallback);
  }
  if (!response.ok) {
    throw new Error(response.status === 401
      ? "Your session has expired. Sign out and sign in again."
      : payload?.error || fallback);
  }
  return payload;
}
