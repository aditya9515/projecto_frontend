"use client";

import {
  onIdTokenChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getFirebaseAuthClient } from "@/lib/firebase/client";
import { syncFirebaseUser } from "@/lib/firebase/sync";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  ready: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    void (async () => {
      const auth = await getFirebaseAuthClient();
      if (!auth) {
        if (!isMounted) {
          return;
        }

        setReady(false);
        setLoading(false);
        return;
      }

      if (!isMounted) {
        return;
      }

      setReady(true);
      unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
        setUser(nextUser);
        setLoading(false);

        if (nextUser) {
          try {
            await syncFirebaseUser(nextUser);
          } catch {
            // Sync errors are surfaced on interactive pages when a user action depends on it.
          }
        }
      });
    })();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      ready,
      signOut: async () => {
        const auth = await getFirebaseAuthClient();
        if (!auth) {
          return;
        }

        await firebaseSignOut(auth);
      },
    }),
    [loading, ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
