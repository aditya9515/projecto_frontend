import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const PROJECTO_FIRESTORE_COLLECTIONS = [
  "users",
  "subscriptions",
  "desktopAuthTokens",
  "desktopSessions",
  "projectDirectories",
  "subscriptionOverrides",
  "processedWebhooks",
  "subscriptionAuditLogs",
];

function loadDotEnvFile(filePath = path.resolve(process.cwd(), ".env")) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = valueParts.join("=").replace(/^"|"$/g, "");
  }
}

export function parseArgs(argv) {
  const result = {
    collections: PROJECTO_FIRESTORE_COLLECTIONS,
    execute: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item?.startsWith("--")) {
      continue;
    }

    const key = item.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--")
      ? argv[index + 1]
      : "true";

    if (key === "execute") {
      result.execute = true;
    } else if (key === "collections") {
      result.collections = value.split(",").map((entry) => entry.trim()).filter(Boolean);
    } else {
      result[key] = value;
    }

    if (value !== "true") {
      index += 1;
    }
  }

  return result;
}

export function validateCleanupArgs(args) {
  if (!args.project || args.project === "true") {
    throw new Error("Provide --project with the Firebase project id to inspect or clean.");
  }

  const invalidCollections = args.collections.filter(
    (collection) => !PROJECTO_FIRESTORE_COLLECTIONS.includes(collection),
  );
  if (invalidCollections.length > 0) {
    throw new Error(`Unsupported collection(s): ${invalidCollections.join(", ")}`);
  }

  if (args.execute && args.confirm !== args.project) {
    throw new Error("Destructive cleanup requires --confirm to exactly match --project.");
  }
}

function getAdminApp(projectId) {
  if (getApps().length > 0) {
    return getApp();
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      projectId,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

async function listCollectionDocs(db, collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => ({
    collection: collectionName,
    id: doc.id,
    data: doc.data(),
  }));
}

async function writeBackup(projectId, records, backupFile) {
  const resolvedBackupFile = backupFile
    ? path.resolve(backupFile)
    : path.resolve("firestore-backups", `${projectId}-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);

  await fsp.mkdir(path.dirname(resolvedBackupFile), { recursive: true });
  await fsp.writeFile(
    resolvedBackupFile,
    records.map((record) => JSON.stringify(record)).join("\n") + (records.length > 0 ? "\n" : ""),
    "utf8",
  );

  return resolvedBackupFile;
}

async function deleteDocs(db, records) {
  let batch = db.batch();
  let pending = 0;
  let deleted = 0;

  for (const record of records) {
    batch.delete(db.collection(record.collection).doc(record.id));
    pending += 1;

    if (pending === 450) {
      await batch.commit();
      deleted += pending;
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) {
    await batch.commit();
    deleted += pending;
  }

  return deleted;
}

export async function cleanupFirestore(args) {
  validateCleanupArgs(args);
  loadDotEnvFile();

  const app = getAdminApp(args.project);
  const db = getFirestore(app);
  const collectionDocs = await Promise.all(
    args.collections.map((collection) => listCollectionDocs(db, collection)),
  );
  const records = collectionDocs.flat();
  const counts = Object.fromEntries(
    args.collections.map((collection, index) => [collection, collectionDocs[index]?.length ?? 0]),
  );

  if (!args.execute) {
    return {
      project: args.project,
      dryRun: true,
      counts,
      total: records.length,
      deleted: 0,
      backupFile: null,
    };
  }

  const backupFile = await writeBackup(args.project, records, args.backupFile);
  const deleted = await deleteDocs(db, records);

  return {
    project: args.project,
    dryRun: false,
    counts,
    total: records.length,
    deleted,
    backupFile,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await cleanupFirestore(args);
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
