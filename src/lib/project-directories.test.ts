import {
  bulkImportUserProjectDirectories,
  createUserProjectDirectory,
  updateUserProjectDirectory,
} from "@/lib/project-directories";
import * as firestore from "@/lib/firestore";
import type { ProjectDirectoryRecord, SubscriptionRecord } from "@/lib/types";

vi.mock("@/lib/firestore", () => ({
  deleteProjectDirectory: vi.fn(),
  getProjectDirectoryById: vi.fn(),
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

describe("project directory rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(firestore.listProjectDirectoriesForUser).mockResolvedValue([]);
    vi.mocked(firestore.listSubscriptionsForUser).mockResolvedValue([]);
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

  it("prevents free users from changing a project directory path", async () => {
    const existing = makeProject({ id: "project_free" });
    vi.mocked(firestore.listProjectDirectoriesForUser).mockResolvedValue([existing]);
    vi.mocked(firestore.getProjectDirectoryById).mockResolvedValue(existing);

    await expect(
      updateUserProjectDirectory("user_1", existing.id, {
        directoryPath: "D:/new-path",
      }),
    ).rejects.toMatchObject({
      code: "project_directory_change_locked",
      status: 403,
    });
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
});
