"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  getAuth,
  type Auth,
} from "firebase/auth";

import { isFirebaseClientConfigured, publicEnv } from "@/lib/env";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let persistenceSetup: Promise<void> | null = null;

function createApp() {
  if (!isFirebaseClientConfigured()) {
    return null;
  }

  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: publicEnv.firebaseApiKey,
        authDomain: publicEnv.firebaseAuthDomain,
        projectId: publicEnv.firebaseProjectId,
        appId: publicEnv.firebaseAppId,
      });

  return firebaseApp;
}

export async function getFirebaseAuthClient() {
  const app = createApp();
  if (!app) {
    return null;
  }

  if (!firebaseAuth) {
    firebaseAuth = getAuth(app);
    firebaseAuth.languageCode = "en";
  }

  if (!persistenceSetup) {
    const auth = firebaseAuth;
    persistenceSetup = (async () => {
      for (const persistence of [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]) {
        try {
          await auth.setPersistence(persistence);
          return;
        } catch {
          // Browsers may block persistent storage; try the next supported option.
        }
      }
      throw new Error("Sign-in storage is unavailable. Please try another browser.");
    })().catch((error) => {
      persistenceSetup = null;
      throw error;
    });
  }
  await persistenceSetup;

  return firebaseAuth;
}
