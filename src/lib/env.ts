import { z } from "zod";

const firebaseAdminEnvSchema = z.object({
  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().email(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1),
});

const dodoEnvSchema = z.object({
  DODO_API_KEY: z.string().min(1),
  DODO_WEBHOOK_SECRET: z.string().min(1),
  DODO_PRO_MONTHLY_PRODUCT_ID: z.string().min(1),
  DODO_PRO_YEARLY_PRODUCT_ID: z.string().min(1),
  DODO_ENVIRONMENT: z.enum(["live_mode", "test_mode"]).optional(),
});

const appRuntimeEnvSchema = z.object({
  APP_BASE_URL: z.string().url(),
  DESKTOP_PROTOCOL: z.string().min(1).default("launchstack://"),
  DESKTOP_ALLOWED_ORIGINS: z.string().optional(),
});

function formatValidationError(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

let cachedDodoEnv: z.infer<typeof dodoEnvSchema> | null = null;
let cachedAppRuntimeEnv: z.infer<typeof appRuntimeEnvSchema> | null = null;
let cachedFirebaseAdminEnv:
  | z.infer<typeof firebaseAdminEnvSchema>
  | null
  | undefined = undefined;

export const publicEnv = {
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  appDownloadUrl: process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL ?? "#",
};

export function isFirebaseClientConfigured() {
  return [
    publicEnv.firebaseApiKey,
    publicEnv.firebaseAuthDomain,
    publicEnv.firebaseProjectId,
    publicEnv.firebaseAppId,
  ].every(Boolean);
}

export function getAppRuntimeEnv() {
  if (cachedAppRuntimeEnv) {
    return cachedAppRuntimeEnv;
  }

  const parsed = appRuntimeEnvSchema.safeParse({
    APP_BASE_URL: process.env.APP_BASE_URL,
    DESKTOP_PROTOCOL: process.env.DESKTOP_PROTOCOL,
    DESKTOP_ALLOWED_ORIGINS: process.env.DESKTOP_ALLOWED_ORIGINS,
  });

  if (!parsed.success) {
    throw new Error(
      `Server environment is not configured correctly: ${formatValidationError(parsed.error)}`,
    );
  }

  cachedAppRuntimeEnv = parsed.data;
  return cachedAppRuntimeEnv;
}

export function getDodoEnv() {
  if (cachedDodoEnv) {
    return cachedDodoEnv;
  }

  const parsed = dodoEnvSchema.safeParse({
    DODO_API_KEY: process.env.DODO_API_KEY,
    DODO_WEBHOOK_SECRET: process.env.DODO_WEBHOOK_SECRET,
    DODO_PRO_MONTHLY_PRODUCT_ID: process.env.DODO_PRO_MONTHLY_PRODUCT_ID,
    DODO_PRO_YEARLY_PRODUCT_ID: process.env.DODO_PRO_YEARLY_PRODUCT_ID,
    DODO_ENVIRONMENT: process.env.DODO_ENVIRONMENT,
  });

  if (!parsed.success) {
    throw new Error(
      `Server environment is not configured correctly: ${formatValidationError(parsed.error)}`,
    );
  }

  cachedDodoEnv = parsed.data;
  return cachedDodoEnv;
}

export function getFirebaseAdminEnv() {
  if (cachedFirebaseAdminEnv !== undefined) {
    return cachedFirebaseAdminEnv;
  }

  const raw = {
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  };

  const providedKeys = Object.values(raw).filter(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (providedKeys.length === 0) {
    cachedFirebaseAdminEnv = null;
    return cachedFirebaseAdminEnv;
  }

  const parsed = firebaseAdminEnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Firebase Admin environment is not configured correctly: ${formatValidationError(parsed.error)}`,
    );
  }

  cachedFirebaseAdminEnv = parsed.data;
  return cachedFirebaseAdminEnv;
}

export function getFirebaseProjectId() {
  const directProjectId =
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (directProjectId) {
    return directProjectId;
  }

  const firebaseConfig = process.env.FIREBASE_CONFIG;
  if (!firebaseConfig) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(firebaseConfig) as { projectId?: string };
    return parsed.projectId;
  } catch {
    return undefined;
  }
}

export function getOptionalAppConfig() {
  return {
    desktopProtocol: process.env.DESKTOP_PROTOCOL ?? "launchstack://",
    appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
    downloadUrl: publicEnv.appDownloadUrl,
  };
}

export function parseAllowedOrigins(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
