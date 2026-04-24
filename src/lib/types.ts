export type BillingCycle = "monthly" | "yearly";
export type AppPlan = "free" | "pro";
export type SubscriptionAccessStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "none";
export type DesktopPlatform = "windows" | "macos" | "linux";
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

export interface DesktopAuthTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
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
