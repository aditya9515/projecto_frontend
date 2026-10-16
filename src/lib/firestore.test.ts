import { markWebhookProcessed, upsertSubscription, upsertProjectDirectories } from "./firestore";
import type { SubscriptionRecord, ProjectDirectoryRecord } from "./types";
const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), create: vi.fn(), batchSet: vi.fn(), commit: vi.fn() }));
vi.mock("@/lib/firebase/admin", () => ({ getAdminDb: () => ({
  collection: () => ({ doc: () => ({ create: mocks.create }) }),
  runTransaction: async (callback: (transaction: unknown) => unknown) => callback({ get: mocks.get, set: mocks.set }),
  batch: () => ({ set: mocks.batchSet, commit: mocks.commit }),
}) }));

describe("subscription and project persistence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.get.mockResolvedValue({ data: () => ({ lastWebhookAt: "2026-10-14T00:00:00Z" }) });
    mocks.commit.mockResolvedValue(undefined);
  });
  it("prevents a delayed webhook from overwriting a newer subscription event", async () => {
    await upsertSubscription({ dodoSubscriptionId: "sub_1" } as SubscriptionRecord, "2026-10-13T00:00:00Z");
    expect(mocks.set).not.toHaveBeenCalled();
    await upsertSubscription({ dodoSubscriptionId: "sub_1" } as SubscriptionRecord, "2026-10-15T00:00:00Z");
    expect(mocks.set).toHaveBeenCalledTimes(1);
  });
  it("distinguishes duplicate webhook receipts from a database outage", async () => {
    mocks.create.mockRejectedValueOnce({ code: 6 });
    await expect(markWebhookProcessed("event", "subscription.active")).resolves.toBe(false);
    mocks.create.mockRejectedValueOnce(new Error("unavailable"));
    await expect(markWebhookProcessed("event", "subscription.active")).rejects.toThrow("unavailable");
  });
  it("persists an import with one batch and propagates a failed commit", async () => {
    mocks.commit.mockRejectedValueOnce(new Error("unavailable"));
    await expect(upsertProjectDirectories([{ id: "project_1" }, { id: "project_2" }] as ProjectDirectoryRecord[])).rejects.toThrow("unavailable");
    expect(mocks.batchSet).toHaveBeenCalledTimes(2);
    expect(mocks.commit).toHaveBeenCalledTimes(1);
  });
});
