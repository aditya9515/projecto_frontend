export type BillingCycle = "monthly" | "yearly";
export type AppPlan = "free" | "pro";
export type SubscriptionAccessStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "none";
export type ProjectArchiveReason = "free_limit";
export type DesktopPlatform = "windows" | "macos" | "linux";
export type ProjectDetectionLevel = "basic" | "advanced";
export type ProjectThemeMode = "light" | "dark";
export type ProjectStorage = "firestore";
export type DodoSubscriptionStatus =
  | "pending"
  | "active"
  | "on_hold"
  | "cancelled"
  | "failed"
  | "expired";

export interface UserProfileRecord {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  providers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  email: string;
  dodoCustomerId: string;
  dodoSubscriptionId: string;
  productId: string;
  plan: AppPlan;
  status: DodoSubscriptionStatus | string;
  billingCycle: BillingCycle;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DesktopSessionRecord {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  platform: DesktopPlatform;
  tokenHash: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revoked: boolean;
}

export interface SubscriptionOverrideRecord {
  userId: string;
  plan: AppPlan;
  status: SubscriptionAccessStatus;
  billingCycle: BillingCycle;
  expiresAt?: string | null;
  reason: string;
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
  source: "manual_admin";
  disabled?: boolean;
}

export interface DesktopAuthTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  stateHash?: string | null;
  expiresAt: string;
  used: boolean;
  createdAt: string;
  usedAt?: string;
}

export interface DesktopEntitlements {
  maxProjects: number | null;
  canChangeProjectDirectories: boolean;
  maxConcurrentLaunches: number | null;
  canBulkImport: boolean;
  canBulkScan: boolean;
  canUseBasicThemes: boolean;
  canUsePremiumThemes: boolean;
  projectStorage: ProjectStorage;
  requiresOnline: true;
  projectDetectionLevel: ProjectDetectionLevel;
  defaultDirectoryLimit: number | null;
  canChangeDefaultDirectories: boolean;
}

export interface AppSubscriptionSnapshot {
  plan: AppPlan;
  status: SubscriptionAccessStatus;
  expiresAt?: string;
  currentPeriodEnd?: string | null;
  currentPeriodStart?: string | null;
  rawStatus?: string;
  cancelAtPeriodEnd?: boolean;
  billingCycle?: BillingCycle;
  entitlements?: DesktopEntitlements;
  archivedProjectCount?: number;
}

export interface DesktopCallbackPayload {
  code: string;
  state: string;
  expiresAt: string;
  redirectUrl: string;
}

export interface CheckoutIntent {
  billingCycle: BillingCycle;
}

export interface AuthSyncPayload {
  email: string;
  displayName: string;
  photoURL: string | null;
  providers: string[];
}

export interface ProjectDirectoryRecord {
  id: string;
  userId: string;
  name: string;
  directoryPath: string;
  detectionLevel: ProjectDetectionLevel;
  detectionSummary: string | null;
  themeMode: ProjectThemeMode;
  themePreset: string | null;
  createdAt: string;
  updatedAt: string;
  lastLaunchedAt: string | null;
  archivedByPlan: boolean;
  archivedAt: string | null;
  archivedReason: ProjectArchiveReason | null;
}

export interface ProjectDirectoryMutationInput {
  name?: string;
  directoryPath?: string;
  detectionLevel?: ProjectDetectionLevel;
  detectionSummary?: string | null;
  themeMode?: ProjectThemeMode;
  themePreset?: string | null;
  lastLaunchedAt?: string | null;
}
