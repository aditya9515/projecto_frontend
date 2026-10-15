"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { authorizedFetch, readApiResponse } from "@/lib/client-api";

export function useAuthorizedResource<T>(user: User | null, path: string, failureMessage: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ userId: string; data: T | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void (async () => {
      try {
        const response = await authorizedFetch(user, path);
        const data = await readApiResponse<T>(response, failureMessage);
        if (active) setResult({ userId: user.uid, data, error: null });
      } catch (error) {
        if (active) setResult({ userId: user.uid, data: null, error: error instanceof Error ? error.message : failureMessage });
      }
    })();
    return () => { active = false; };
  }, [attempt, failureMessage, path, user]);

  const retry = useCallback(() => {
    setResult(null);
    setAttempt((current) => current + 1);
  }, []);
  const current = user && result?.userId === user.uid ? result : null;
  return { data: current?.data ?? null, error: current?.error ?? null, loading: !!user && !current, retry };
}
