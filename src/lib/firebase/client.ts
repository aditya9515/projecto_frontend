"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  type Auth,
} from "firebase/auth";

import { isFirebaseClientConfigured, publicEnv } from "@/lib/env";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let persistenceConfigured = false;

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

  if (!persistenceConfigured) {
    await firebaseAuth.setPersistence(browserLocalPersistence);
    persistenceConfigured = true;
  }

  return firebaseAuth;
}
