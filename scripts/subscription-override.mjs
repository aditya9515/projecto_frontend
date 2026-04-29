import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

async function resolveUserId(db, identifier) {
  if (!identifier) {
    throw new Error("Provide --uid or --email.");
  }

  if (!identifier.includes("@")) {
    return identifier;
  }

  const snapshot = await db
    .collection("users")
    .where("email", "==", identifier)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error(`No user profile found for email: ${identifier}`);
  }

  const user = snapshot.docs[0]?.data();
  if (!user?.uid) {
    throw new Error(`User profile for ${identifier} is missing uid.`);
  }

  return user.uid;
}

function parseArgs(argv) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item?.startsWith("--")) {
      continue;
    }

    const key = item.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--")
      ? argv[index + 1]
      : "true";

    result[key] = value;

    if (value !== "true") {
      index += 1;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const action = args.action ?? "grant";
  const identifier = args.uid ?? args.email;
  const updatedBy = args.updatedBy ?? "manual-cli";
  const reason = args.reason ?? "manual override";
  const billingCycle = args.billingCycle ?? "monthly";
  const expiresAt = args.expiresAt && args.expiresAt !== "null"
    ? new Date(args.expiresAt).toISOString()
    : null;

  if (!["grant", "disable", "delete"].includes(action)) {
    throw new Error("Action must be one of: grant, disable, delete.");
  }

  if (!["monthly", "yearly"].includes(billingCycle)) {
    throw new Error("billingCycle must be monthly or yearly.");
  }

  const app = getAdminApp();
  const db = getFirestore(app);
  const userId = await resolveUserId(db, identifier);
  const reference = db.collection("subscriptionOverrides").doc(userId);

  if (action === "delete") {
    await reference.delete();
    console.log(`Deleted subscription override for user ${userId}.`);
    return;
  }

  const now = new Date().toISOString();
  const existing = await reference.get();
  const createdAt = existing.exists
    ? existing.data()?.createdAt ?? now
    : now;

  await reference.set(
    {
      userId,
      plan: "pro",
      status: action === "disable" ? "none" : "active",
      billingCycle,
      expiresAt,
      reason,
      updatedBy,
      updatedAt: now,
      createdAt,
      source: "manual_admin",
      disabled: action === "disable",
    },
    { merge: true },
  );

  console.log(
    `${action === "disable" ? "Disabled" : "Granted"} Pro override for ${userId}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
