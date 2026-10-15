import { describe, it, expect, beforeEach, vi } from "vitest";

// An optimistic in-memory Firestore model. It retries conflicting document reads
// and rejects reads after writes, exercising the real transaction and business code.
const database = vi.hoisted(() => {
  type RecordData = Record<string, unknown>;
  type Reference = { key?: string; collection?: string; userId?: string };
  const records = new Map<string, RecordData>();
  const versions = new Map<string, number>();
  const read = (ref: Reference, view = records) => ref.key
    ? { exists: view.has(ref.key), data: () => view.get(ref.key!) }
    : { docs: [...view.entries()].filter(([key, data]) => key.startsWith(ref.collection + "/") && data.userId === ref.userId).map(([, data]) => ({ data: () => data })) };
  return { records, versions, db: {
    collection: (collection: string) => ({
      doc: (id: string) => ({ key: collection + "/" + id, get: async () => read({ key: collection + "/" + id }) }),
      where: (_field: string, _op: string, userId: string) => ({ collection, userId, get: async () => read({ collection, userId }) }),
    }),
    runTransaction: async (callback: (tx: unknown) => Promise<unknown>) => {
      for (let attempt = 0; attempt < 10; attempt++) {
        const snapshot = new Map(records);
        const snapshotVersions = new Map(versions);
        const reads = new Set<string>();
        const writes = new Map<string, RecordData | null>();
        const result = await callback({
          get: async (ref: Reference) => {
            if (writes.size) throw new Error("Firestore does not permit reads after writes");
            if (ref.key) reads.add(ref.key);
            return read(ref, snapshot);
          },
          set: (ref: Reference, data: RecordData) => writes.set(ref.key!, data),
          delete: (ref: Reference) => writes.set(ref.key!, null),
        });
        if ([...reads].some((key) => (versions.get(key) ?? 0) !== (snapshotVersions.get(key) ?? 0))) continue;
        for (const [key, data] of writes) {
          if (data) records.set(key, { ...records.get(key), ...data }); else records.delete(key);
          versions.set(key, (versions.get(key) ?? 0) + 1);
        }
        return result;
      }
      throw new Error("Transaction retry limit reached");
    },
  } };
});
vi.mock("@/lib/firebase/admin", () => ({ getAdminDb: () => database.db }));
import { createUserProjectDirectory, listUserProjectDirectories } from "./project-directories";

beforeEach(() => { database.records.clear(); database.versions.clear(); });
describe("project admission across concurrent server requests", () => {
  it("admits exactly five concurrent creates for a free account", async () => {
    const results = await Promise.allSettled(Array.from({ length: 6 }, (_, i) => createUserProjectDirectory("user", { directoryPath: "C:/workspace-" + i })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5);
    expect(results.find((r) => r.status === "rejected")).toMatchObject({ reason: { code: "project_limit_reached" } });
    expect((await listUserProjectDirectories("user")).projects).toHaveLength(5);
  });
  it("rejects a concurrent duplicate with different Windows casing and slashes", async () => {
    const results = await Promise.allSettled([
      createUserProjectDirectory("user", { directoryPath: "C:/Workspace/App/" }),
      createUserProjectDirectory("user", { directoryPath: "c:\\workspace\\app" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await listUserProjectDirectories("user")).projects).toHaveLength(1);
  });
});
