import { getAdminDb } from "@/lib/firebase/admin";
import type {
  DesktopAuthTokenRecord,
  DesktopSessionRecord,
  ProjectDirectoryRecord,
  SubscriptionRecord,
  SubscriptionOverrideRecord,
  UserProfileRecord,
} from "@/lib/types";

const USERS = "users";
const SUBSCRIPTIONS = "subscriptions";
const DESKTOP_AUTH_TOKENS = "desktopAuthTokens";
const DESKTOP_SESSIONS = "desktopSessions";
const PROJECT_DIRECTORIES = "projectDirectories";
const SUBSCRIPTION_OVERRIDES = "subscriptionOverrides";
const PROCESSED_WEBHOOKS = "processedWebhooks";

export async function upsertUserProfile(record: UserProfileRecord) {
  const db = getAdminDb();
  await db.collection(USERS).doc(record.uid).set(record, { merge: true });
}

export async function getUserProfile(uid: string) {
  const snapshot = await getAdminDb().collection(USERS).doc(uid).get();
  return snapshot.exists ? (snapshot.data() as UserProfileRecord) : null;
}

export async function listSubscriptionsForUser(userId: string) {
  const snapshot = await getAdminDb()
    .collection(SUBSCRIPTIONS)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.map((doc) => doc.data() as SubscriptionRecord);
}

export async function getSubscriptionById(subscriptionId: string) {
  const snapshot = await getAdminDb()
    .collection(SUBSCRIPTIONS)
    .doc(subscriptionId)
    .get();

  return snapshot.exists ? (snapshot.data() as SubscriptionRecord) : null;
}

export async function upsertSubscription(record: SubscriptionRecord) {
  await getAdminDb()
    .collection(SUBSCRIPTIONS)
    .doc(record.dodoSubscriptionId)
    .set(record, { merge: true });
}

export async function getSubscriptionOverride(userId: string) {
  const snapshot = await getAdminDb()
    .collection(SUBSCRIPTION_OVERRIDES)
    .doc(userId)
    .get();

  return snapshot.exists
    ? (snapshot.data() as SubscriptionOverrideRecord)
    : null;
}

export async function upsertSubscriptionOverride(record: SubscriptionOverrideRecord) {
  await getAdminDb()
    .collection(SUBSCRIPTION_OVERRIDES)
    .doc(record.userId)
    .set(record, { merge: true });
}

export async function deleteSubscriptionOverride(userId: string) {
  await getAdminDb().collection(SUBSCRIPTION_OVERRIDES).doc(userId).delete();
}

export async function markWebhookProcessed(webhookId: string, type: string) {
  try {
    await getAdminDb().collection(PROCESSED_WEBHOOKS).doc(webhookId).create({
      type,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function createDesktopAuthToken(record: DesktopAuthTokenRecord) {
  await getAdminDb()
    .collection(DESKTOP_AUTH_TOKENS)
    .doc(record.id)
    .set(record, { merge: true });
}

export async function getDesktopAuthToken(id: string) {
  const snapshot = await getAdminDb()
    .collection(DESKTOP_AUTH_TOKENS)
    .doc(id)
    .get();

  return snapshot.exists ? (snapshot.data() as DesktopAuthTokenRecord) : null;
}

export async function markDesktopAuthTokenUsed(id: string) {
  await getAdminDb().collection(DESKTOP_AUTH_TOKENS).doc(id).set(
    {
      used: true,
      usedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function consumeDesktopAuthToken(id: string) {
  const db = getAdminDb();
  const reference = db.collection(DESKTOP_AUTH_TOKENS).doc(id);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      return null;
    }

    const record = snapshot.data() as DesktopAuthTokenRecord;
    if (record.used) {
      return null;
    }

    transaction.set(
      reference,
      {
        used: true,
        usedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return record;
  });
}

export async function createDesktopSession(record: DesktopSessionRecord) {
  await getAdminDb()
    .collection(DESKTOP_SESSIONS)
    .doc(record.id)
    .set(record, { merge: true });
}

export async function getDesktopSession(id: string) {
  const snapshot = await getAdminDb()
    .collection(DESKTOP_SESSIONS)
    .doc(id)
    .get();

  return snapshot.exists ? (snapshot.data() as DesktopSessionRecord) : null;
}

export async function touchDesktopSession(id: string) {
  await getAdminDb().collection(DESKTOP_SESSIONS).doc(id).set(
    {
      lastSeenAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function listProjectDirectoriesForUser(userId: string) {
  const snapshot = await getAdminDb()
    .collection(PROJECT_DIRECTORIES)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.map((doc) => doc.data() as ProjectDirectoryRecord);
}

export async function getProjectDirectoryById(projectId: string) {
  const snapshot = await getAdminDb()
    .collection(PROJECT_DIRECTORIES)
    .doc(projectId)
    .get();

  return snapshot.exists ? (snapshot.data() as ProjectDirectoryRecord) : null;
}

export async function upsertProjectDirectory(record: ProjectDirectoryRecord) {
  await getAdminDb()
    .collection(PROJECT_DIRECTORIES)
    .doc(record.id)
    .set(record, { merge: true });
}

export async function deleteProjectDirectory(projectId: string) {
  await getAdminDb().collection(PROJECT_DIRECTORIES).doc(projectId).delete();
}
