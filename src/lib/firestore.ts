import { AsyncLocalStorage } from "node:async_hooks";
import { FieldValue, Timestamp, type Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type {
  DesktopAuthTokenRecord,
  DesktopSessionPublicRecord,
  DesktopSessionRecord,
  ProjectDirectoryRecord,
  SubscriptionRecord,
  SubscriptionOverrideRecord,
  SubscriptionAuditRecord,
  UserProfileRecord,
} from "@/lib/types";

const USERS = "users";
const SUBSCRIPTIONS = "subscriptions";
const DESKTOP_AUTH_TOKENS = "desktopAuthTokens";
const DESKTOP_SESSIONS = "desktopSessions";
const PROJECT_DIRECTORIES = "projectDirectories";
const SUBSCRIPTION_OVERRIDES = "subscriptionOverrides";
const PROCESSED_WEBHOOKS = "processedWebhooks";
const SUBSCRIPTION_AUDIT_LOGS = "subscriptionAuditLogs";

const directoryTransaction = new AsyncLocalStorage<Transaction>();

/** The shared per-user document makes otherwise independent project writes conflict and retry. */
export async function withProjectDirectoryTransaction<T>(userId: string, operation: () => Promise<T>): Promise<T> {
  if (directoryTransaction.getStore()) return operation();
  const db = getAdminDb();
  const guard = db.collection("projectDirectoryState").doc(userId);
  return db.runTransaction(async (transaction) => {
    await transaction.get(guard);
    const result = await directoryTransaction.run(transaction, operation);
    transaction.set(guard, { revision: FieldValue.increment(1), updatedAt: new Date().toISOString() }, { merge: true });
    return result;
  });
}

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

export async function upsertSubscription(record: SubscriptionRecord, eventTimestamp?: string) {
  if (eventTimestamp) {
    const db = getAdminDb();
    const reference = db.collection(SUBSCRIPTIONS).doc(record.dodoSubscriptionId);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const existingTimestamp = snapshot.data()?.lastWebhookAt as string | undefined;
      if (existingTimestamp && Date.parse(existingTimestamp) > Date.parse(eventTimestamp)) return;
      transaction.set(reference, { ...record, lastWebhookAt: eventTimestamp }, { merge: true });
    });
    return;
  }
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
  } catch (error) {
    if ((error as { code?: number }).code === 6) return false;
    throw error;
  }
}

export async function isWebhookProcessed(webhookId: string) {
  return (await getAdminDb().collection(PROCESSED_WEBHOOKS).doc(webhookId).get()).exists;
}

export async function createDesktopAuthToken(record: DesktopAuthTokenRecord) {
  await getAdminDb()
    .collection(DESKTOP_AUTH_TOKENS)
    .doc(record.id)
    .set({ ...record, deleteAfter: Timestamp.fromDate(new Date(record.expiresAt)) }, { merge: true });
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
    if (record.used || Date.parse(record.expiresAt) <= Date.now()) {
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
    .set({ ...record, deleteAfter: Timestamp.fromDate(new Date(record.expiresAt)) }, { merge: true });
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

export async function listDesktopSessionsForUser(userId: string) {
  const snapshot = await getAdminDb()
    .collection(DESKTOP_SESSIONS)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs
    .map((doc) => doc.data() as DesktopSessionRecord)
    .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt));
}

export async function revokeDesktopSessionForUser(
  userId: string,
  sessionId: string,
) {
  const session = await getDesktopSession(sessionId);

  if (!session || session.userId !== userId) {
    return null;
  }

  const revokedAt = new Date().toISOString();
  await getAdminDb().collection(DESKTOP_SESSIONS).doc(sessionId).set(
    {
      revoked: true,
      revokedAt,
      lastSeenAt: revokedAt,
    },
    { merge: true },
  );

  return {
    ...session,
    revoked: true,
    revokedAt,
    lastSeenAt: revokedAt,
  } satisfies DesktopSessionRecord;
}

export function toPublicDesktopSession(
  session: DesktopSessionRecord,
  currentSessionId?: string,
): DesktopSessionPublicRecord {
  return {
    id: session.id,
    deviceId: session.deviceId,
    deviceName: session.deviceName,
    platform: session.platform,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    expiresAt: session.expiresAt,
    revoked: session.revoked,
    current: currentSessionId ? session.id === currentSessionId : undefined,
  };
}

export async function appendSubscriptionAuditLog(
  record: Omit<SubscriptionAuditRecord, "id" | "createdAt">,
) {
  const reference = getAdminDb().collection(SUBSCRIPTION_AUDIT_LOGS).doc();
  await reference.set({
    ...record,
    id: reference.id,
    createdAt: new Date().toISOString(),
  } satisfies SubscriptionAuditRecord);
}

export async function listProjectDirectoriesForUser(userId: string) {
  const query = getAdminDb().collection(PROJECT_DIRECTORIES).where("userId", "==", userId);
  const transaction = directoryTransaction.getStore();
  const snapshot = transaction ? await transaction.get(query) : await query.get();

  return snapshot.docs.map((doc) => doc.data() as ProjectDirectoryRecord);
}

export async function getProjectDirectoryById(projectId: string) {
  const reference = getAdminDb().collection(PROJECT_DIRECTORIES).doc(projectId);
  const transaction = directoryTransaction.getStore();
  const snapshot = transaction ? await transaction.get(reference) : await reference.get();

  return snapshot.exists ? (snapshot.data() as ProjectDirectoryRecord) : null;
}

export async function upsertProjectDirectory(record: ProjectDirectoryRecord) {
  const reference = getAdminDb().collection(PROJECT_DIRECTORIES).doc(record.id);
  const transaction = directoryTransaction.getStore();
  if (transaction) { transaction.set(reference, record, { merge: true }); return; }
  await reference.set(record, { merge: true });
}

export async function upsertProjectDirectories(records: ProjectDirectoryRecord[]) {
  const db = getAdminDb();
  const transaction = directoryTransaction.getStore();
  if (transaction) {
    for (const record of records) transaction.set(db.collection(PROJECT_DIRECTORIES).doc(record.id), record, { merge: true });
    return;
  }
  // Imports are limited to a single atomic batch. Reconciliation can span batches.
  for (let index = 0; index < records.length; index += 500) {
    const batch = db.batch();
    for (const record of records.slice(index, index + 500)) {
      batch.set(db.collection(PROJECT_DIRECTORIES).doc(record.id), record, { merge: true });
    }
    await batch.commit();
  }
}

export async function deleteProjectDirectory(projectId: string) {
  const reference = getAdminDb().collection(PROJECT_DIRECTORIES).doc(projectId);
  const transaction = directoryTransaction.getStore();
  if (transaction) { transaction.delete(reference); return; }
  await reference.delete();
}
