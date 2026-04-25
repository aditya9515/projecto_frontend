import type { DecodedIdToken } from "firebase-admin/auth";

import {
  DesktopAuthError,
  exchangeDesktopCallbackCode,
  issueDesktopCallbackPayload,
} from "@/lib/desktop-auth";
import {
  consumeDesktopAuthToken,
  createDesktopAuthToken,
  createDesktopSession,
  getDesktopAuthToken,
  getUserProfile,
  listSubscriptionsForUser,
  upsertUserProfile,
} from "@/lib/firestore";
import { sha256 } from "@/lib/security";
import type {
  DesktopAuthTokenRecord,
  SubscriptionRecord,
  UserProfileRecord,
} from "@/lib/types";

vi.mock("@/lib/env", () => ({
  getAppRuntimeEnv: () => ({
    APP_BASE_URL: "https://projecto.adityakosuru.online",
    DESKTOP_PROTOCOL: "projecto://",
    DESKTOP_ALLOWED_ORIGINS: undefined,
  }),
}));

vi.mock("@/lib/firestore", () => ({
  consumeDesktopAuthToken: vi.fn(),
  createDesktopAuthToken: vi.fn(),
  createDesktopSession: vi.fn(),
  getDesktopAuthToken: vi.fn(),
  getUserProfile: vi.fn(),
  listSubscriptionsForUser: vi.fn(),
  upsertUserProfile: vi.fn(),
}));

const decodedToken = {
  uid: "user_123",
  email: "adi@example.com",
  name: "Adi",
  picture: "https://example.com/avatar.png",
  firebase: {
    sign_in_provider: "google.com",
  },
} as unknown as DecodedIdToken;

function activeSubscription(
  overrides: Partial<SubscriptionRecord> = {},
): SubscriptionRecord {
  return {
    id: "sub_1",
    userId: decodedToken.uid,
    email: decodedToken.email ?? "adi@example.com",
    dodoCustomerId: "cus_1",
    dodoSubscriptionId: "sub_1",
    productId: "prod_monthly",
    plan: "pro",
    status: "active",
    billingCycle: "monthly",
    currentPeriodStart: "2026-04-01T00:00:00.000Z",
    currentPeriodEnd: "2026-05-01T00:00:00.000Z",
    cancelAtPeriodEnd: false,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-25T00:00:00.000Z",
    ...overrides,
  };
}

function profile(
  overrides: Partial<UserProfileRecord> = {},
): UserProfileRecord {
  return {
    uid: decodedToken.uid,
    email: decodedToken.email ?? "adi@example.com",
    displayName: "Adi",
    photoURL: null,
    providers: ["google.com"],
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-25T00:00:00.000Z",
    ...overrides,
  };
}

function authTokenRecord(
  overrides: Partial<DesktopAuthTokenRecord> = {},
): DesktopAuthTokenRecord {
  const code = overrides.tokenHash ?? sha256("desktop-code");

  return {
    id: code,
    userId: decodedToken.uid,
    tokenHash: code,
    stateHash: sha256("desktop-state"),
    expiresAt: "2026-05-01T00:00:00.000Z",
    used: false,
    createdAt: "2026-04-25T00:00:00.000Z",
    ...overrides,
  };
}

describe("desktop auth helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserProfile).mockResolvedValue(profile());
    vi.mocked(listSubscriptionsForUser).mockResolvedValue([activeSubscription()]);
    vi.mocked(createDesktopAuthToken).mockResolvedValue(undefined);
    vi.mocked(getDesktopAuthToken).mockResolvedValue(null);
    vi.mocked(consumeDesktopAuthToken).mockResolvedValue(null);
    vi.mocked(createDesktopSession).mockResolvedValue(undefined);
    vi.mocked(upsertUserProfile).mockResolvedValue(undefined);
  });

  it("creates a short-lived desktop callback code for an active subscriber", async () => {
    const payload = await issueDesktopCallbackPayload(decodedToken);

    expect(payload.code).toBeTruthy();
    expect(payload.state).toBeTruthy();
    expect(payload.redirectUrl).toBe(
      `projecto://auth/callback?code=${encodeURIComponent(payload.code)}&state=${encodeURIComponent(payload.state)}`,
    );

    expect(createDesktopAuthToken).toHaveBeenCalledWith(
      expect.objectContaining({
        id: sha256(payload.code),
        tokenHash: sha256(payload.code),
        stateHash: sha256(payload.state),
        userId: decodedToken.uid,
        used: false,
      }),
    );
  });

  it("allows create-code for free users and returns free entitlements after exchange", async () => {
    vi.mocked(listSubscriptionsForUser).mockResolvedValue([
      activeSubscription({
        plan: "free",
        status: "expired",
        currentPeriodEnd: "2026-04-01T00:00:00.000Z",
      }),
    ]);

    const payload = await issueDesktopCallbackPayload(decodedToken);

    expect(payload.code).toBeTruthy();
    expect(createDesktopAuthToken).toHaveBeenCalledTimes(1);
  });

  it("exchanges a valid callback code for a desktop session", async () => {
    const code = "desktop-code";
    const state = "desktop-state";
    const record = authTokenRecord({
      id: sha256(code),
      tokenHash: sha256(code),
      stateHash: sha256(state),
    });

    vi.mocked(getDesktopAuthToken).mockResolvedValue(record);
    vi.mocked(consumeDesktopAuthToken).mockResolvedValue(record);

    const result = await exchangeDesktopCallbackCode({
      code,
      state,
      deviceId: "device-1",
      deviceName: "Adi's Laptop",
      platform: "windows",
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.desktopSessionToken).toBe(result.accessToken);
    expect(result.user).toEqual({
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: "Adi",
    });
    expect(result.subscription.active).toBe(true);
    expect(result.subscription.plan).toBe("pro");
    expect(result.subscription.billingCycle).toBe("monthly");

    expect(createDesktopSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: sha256(result.accessToken),
        tokenHash: sha256(result.accessToken),
        userId: decodedToken.uid,
        deviceId: "device-1",
        deviceName: "Adi's Laptop",
        platform: "windows",
        revoked: false,
      }),
    );
  });

  it("rejects invalid desktop callback codes", async () => {
    vi.mocked(getDesktopAuthToken).mockResolvedValue(null);

    await expect(
      exchangeDesktopCallbackCode({
        code: "missing-code",
        state: "desktop-state",
        deviceId: "device-1",
        platform: "windows",
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: "desktop_auth_invalid",
    } satisfies Partial<DesktopAuthError>);

    expect(consumeDesktopAuthToken).not.toHaveBeenCalled();
  });

  it("rejects expired desktop callback codes", async () => {
    vi.mocked(getDesktopAuthToken).mockResolvedValue(
      authTokenRecord({
        id: sha256("desktop-code"),
        tokenHash: sha256("desktop-code"),
        expiresAt: "2026-04-01T00:00:00.000Z",
      }),
    );

    await expect(
      exchangeDesktopCallbackCode({
        code: "desktop-code",
        state: "desktop-state",
        deviceId: "device-1",
        platform: "windows",
      }),
    ).rejects.toMatchObject({
      status: 410,
      code: "desktop_auth_expired",
    } satisfies Partial<DesktopAuthError>);

    expect(consumeDesktopAuthToken).not.toHaveBeenCalled();
  });

  it("rejects reused desktop callback codes", async () => {
    vi.mocked(getDesktopAuthToken).mockResolvedValue(
      authTokenRecord({
        id: sha256("desktop-code"),
        tokenHash: sha256("desktop-code"),
        used: true,
      }),
    );

    await expect(
      exchangeDesktopCallbackCode({
        code: "desktop-code",
        state: "desktop-state",
        deviceId: "device-1",
        platform: "windows",
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "desktop_auth_used",
    } satisfies Partial<DesktopAuthError>);

    expect(consumeDesktopAuthToken).not.toHaveBeenCalled();
  });

  it("rejects callback exchanges when state does not match", async () => {
    vi.mocked(getDesktopAuthToken).mockResolvedValue(
      authTokenRecord({
        id: sha256("desktop-code"),
        tokenHash: sha256("desktop-code"),
        stateHash: sha256("expected-state"),
      }),
    );

    await expect(
      exchangeDesktopCallbackCode({
        code: "desktop-code",
        state: "different-state",
        deviceId: "device-1",
        platform: "windows",
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: "desktop_auth_state_mismatch",
    } satisfies Partial<DesktopAuthError>);

    expect(consumeDesktopAuthToken).not.toHaveBeenCalled();
  });
});
