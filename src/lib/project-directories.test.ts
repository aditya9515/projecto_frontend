import {
  bulkImportUserProjectDirectories,
  createUserProjectDirectory,
  getProjectDirectoryAccess,
  reconcileProjectDirectoryVisibility,
  updateUserProjectDirectory,
} from "@/lib/project-directories";
import * as firestore from "@/lib/firestore";
import type {
  ProjectDirectoryRecord,
  SubscriptionOverrideRecord,
  SubscriptionRecord,
} from "@/lib/types";

vi.mock("@/lib/firestore", () => ({
  deleteProjectDirectory: vi.fn(),
  getProjectDirectoryById: vi.fn(),
  getSubscriptionOverride: vi.fn(),
  listProjectDirectoriesForUser: vi.fn(),
  listSubscriptionsForUser: vi.fn(),
  upsertProjectDirectory: vi.fn(),
}));

const makeProject = (overrides: Partial<ProjectDirectoryRecord>): ProjectDirectoryRecord => ({
  id: "project_1",
  userId: "user_1",
  name: "Workspace",
  directoryPath: "C:/workspace",
  detectionLevel: "basic",
  detectionSummary: null,
  themeMode: "dark",
  themePreset: null,
  createdAt: "2026-04-25T00:00:00.000Z",
  updatedAt: "2026-04-25T00:00:00.000Z",
  lastLaunchedAt: null,
  archivedByPlan: false,
  archivedAt: null,
  archivedReason: null,
  ...overrides,
});

const makeSubscription = (
  overrides: Partial<SubscriptionRecord>,
): SubscriptionRecord => ({
  id: "sub_1",
  userId: "user_1",
  email: "user@example.com",
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
  updatedAt: "2026-04-20T00:00:00.000Z",
  ...overrides,
});

const manualOverride = (
  overrides: Partial<SubscriptionOverrideRecord> = {},
): SubscriptionOverrideRecord => ({
  userId: "user_1",
  plan: "pro",
  status: "active",
  billingCycle: "monthly",
  expiresAt: null,
  reason: "support grant",
  updatedBy: "support@example.com",
  updatedAt: "2026-04-25T00:00:00.000Z",
  createdAt: "2026-04-25T00:00:00.000Z",
  source: "manual_admin",
  ...overrides,
});

describe("project directory rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(firestore.listProjectDirectoriesForUser).mockResolvedValue([]);
    vi.mocked(firestore.listSubscriptionsForUser).mockResolvedValue([]);
    vi.mocked(firestore.getSubscriptionOverride).mockResolvedValue(null);
    vi.mocked(firestore.getProjectDirectoryById).mockResolvedValue(null);
    vi.mocked(firestore.upsertProjectDirectory).mockResolvedValue(undefined);
  });

  it("prevents free users from creating more than five project directories", async () => {
    vi.mocked(firestore.listProjectDirectoriesForUser).mockResolvedValue(
      Array.from({ length: 5 }, (_, index) =>
        makeProject({
          id: `project_${index + 1}`,
          directoryPath: `C:/workspace-${index + 1}`,
        }),
      ),
    );

    await expect(
      createUserProjectDirectory("user_1", {
        directoryPath: "C:/workspace-6",
      }),
    ).rejects.toMatchObject({
      code: "project_limit_reached",
      status: 403,
    });
  });

  it("allows free users to change a project directory path", async () => {
    const existing = makeProject({ id: "project_free" });
    vi.mocked(firestore.listProjectDirectoriesForUser).mockResolvedValue([existing]);
    vi.mocked(firestore.getProjectDirectoryById).mockResolvedValue(existing);

    const result = await updateUserProjectDirectory("user_1", existing.id, {
      directoryPath: "D:/new-path",
    });

    expect(result.project.directoryPath).toBe("D:/new-path");
    expect(result.entitlements.canChangeProjectDirectories).toBe(true);
  });

  it("locks bulk import for free users", async () => {
    await expect(
      bulkImportUserProjectDirectories("user_1", [
        { directoryPath: "C:/workspace-a" },
        { directoryPath: "C:/workspace-b" },
      ]),
    ).rejects.toMatchObject({
      code: "project_bulk_import_locked",
      status: 403,
    });
  });

  it("allows active pro users to change project directories", async () => {
    const existing = makeProject({
      id: "project_pro",
      directoryPath: "C:/workspace-pro",
      detectionLevel: "advanced",
    });
    vi.mocked(firestore.listSubscriptionsForUser).mockResolvedValue([
      makeSubscription({ plan: "pro", status: "active" }),
    ]);
    vi.mocked(firestore.listProjectDirectoriesForUser).mockResolvedValue([existing]);
    vi.mocked(firestore.getProjectDirectoryById).mockResolvedValue(existing);

    const result = await updateUserProjectDirectory("user_1", existing.id, {
      directoryPath: "D:/workspace-pro",
      detectionLevel: "advanced",
    });

    expect(result.project.directoryPath).toBe("D:/workspace-pro");
    expect(result.entitlements.canChangeProjectDirectories).toBe(true);
  });

  it("archives all but the five most recently launched projects for free users", async () => {
    const projects = Array.from({ length: 7 }, (_, index) =>
      makeProject({
        id: `project_${index + 1}`,
        directoryPath: `C:/workspace-${index + 1}`,
        lastLaunchedAt: `2026-04-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
      }),
    );

    const result = await reconcileProjectDirectoryVisibility(projects, 5);

    expect(result.projects).toHaveLength(5);
    expect(result.archivedProjects).toHaveLength(2);
    expect(result.projects.map((project) => project.id)).toEqual([
      "project_7",
      "project_6",
      "project_5",
      "project_4",
      "project_3",
    ]);
    expect(result.archivedProjects.map((project) => project.id)).toEqual([
      "project_2",
      "project_1",
    ]);
    expect(firestore.upsertProjectDirectory).toHaveBeenCalledTimes(2);
  });

  it("falls back to updatedAt when lastLaunchedAt is missing during archiving", async () => {
    const result = await reconcileProjectDirectoryVisibility(
      [
        makeProject({
          id: "project_old",
          directoryPath: "C:/old",
          lastLaunchedAt: null,
          updatedAt: "2026-04-01T00:00:00.000Z",
        }),
        makeProject({
          id: "project_new",
          directoryPath: "C:/new",
          lastLaunchedAt: null,
          updatedAt: "2026-04-28T00:00:00.000Z",
        }),
      ],
      1,
    );

    expect(result.projects.map((project) => project.id)).toEqual(["project_new"]);
    expect(result.archivedProjects.map((project) => project.id)).toEqual(["project_old"]);
  });

  it("restores archived projects when effective pro access returns", async () => {
    vi.mocked(firestore.listProjectDirectoriesForUser).mockResolvedValue([
      makeProject({
        id: "project_archived",
        directoryPath: "C:/archived",
        archivedByPlan: true,
        archivedAt: "2026-04-20T00:00:00.000Z",
        archivedReason: "free_limit",
      }),
    ]);
    vi.mocked(firestore.listSubscriptionsForUser).mockResolvedValue([
      makeSubscription({ plan: "free", status: "expired" }),
    ]);
    vi.mocked(firestore.getSubscriptionOverride).mockResolvedValue(
      manualOverride(),
    );

    const result = await getProjectDirectoryAccess("user_1");

    expect(result.subscription.plan).toBe("pro");
    expect(result.projects).toHaveLength(1);
    expect(result.archivedProjects).toHaveLength(0);
    expect(result.projects[0]?.archivedByPlan).toBe(false);
    expect(firestore.upsertProjectDirectory).toHaveBeenCalledTimes(1);
  });
});
