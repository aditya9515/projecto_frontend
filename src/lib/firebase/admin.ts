import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { getFirebaseAdminEnv, getFirebaseProjectId } from "@/lib/env";

export function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApp();
  }

  const adminEnv = getFirebaseAdminEnv();
  const projectId = adminEnv?.FIREBASE_ADMIN_PROJECT_ID ?? getFirebaseProjectId();

  if (adminEnv) {
    return initializeApp({
      credential: cert({
        projectId: adminEnv.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: adminEnv.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: adminEnv.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      projectId,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
