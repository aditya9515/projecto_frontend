import path from "node:path";
import {
  withProjectDirectoryTransaction,
  deleteProjectDirectory,
  getProjectDirectoryById,
  listProjectDirectoriesForUser,
  upsertProjectDirectory,
  upsertProjectDirectories,
} from "@/lib/firestore";
import { createOpaqueToken, nowIso } from "@/lib/security";
import { getEffectiveSubscriptionAccess } from "@/lib/subscription-access";
import type {
  DesktopEntitlements,
  ProjectDetectionLevel,
  ProjectArchiveReason,
  ProjectDirectoryMutationInput,
  ProjectDirectoryRecord,
} from "@/lib/types";

export class ProjectDirectoryError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ProjectDirectoryError";
  }
}

function trimOrNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeDirectoryPath(directoryPath?: string) {
  const normalized = directoryPath?.trim();
  if (!normalized) {
    throw new ProjectDirectoryError(
      "Project directory path is required.",
      400,
      "project_directory_path_required",
    );
  }

  return normalized;
}

export function canonicalDirectoryPath(value: string): string {
  const trimmed = value.trim();
  if (/^[a-z]:[\\/]|^\\\\|^\/\//i.test(trimmed)) {
    return path.win32.normalize(trimmed).replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  }
  return path.posix.normalize(trimmed).replace(/\/+$/, "") || "/";
}

function deriveProjectName(directoryPath: string, name?: string) {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  const normalized = directoryPath.replace(/[\\/]+$/, "");
  const segments = normalized.split(/[\\/]/).filter(Boolean);
  return segments.at(-1) ?? "Project";
}

function ensureUniqueDirectoryPath(
  projects: ProjectDirectoryRecord[],
  directoryPath: string,
  excludeId?: string,
) {
  const duplicate = projects.find(
    (project) =>
      canonicalDirectoryPath(project.directoryPath) === canonicalDirectoryPath(directoryPath) && project.id !== excludeId,
  );

  if (duplicate) {
    throw new ProjectDirectoryError(
      "A project already exists for this directory path.",
      409,
      "project_directory_duplicate",
    );
  }
}

function ensureThemeAccess(
  input: Pick<ProjectDirectoryMutationInput, "themePreset">,
  entitlements: DesktopEntitlements,
) {
  if (trimOrNull(input.themePreset) && !entitlements.canUsePremiumThemes) {
    throw new ProjectDirectoryError(
      "Premium themes require Projecto Pro.",
      403,
      "project_theme_premium_locked",
    );
  }
}

function resolveDetectionLevel(
  requested: ProjectDetectionLevel | undefined,
  entitlements: DesktopEntitlements,
) {
  if (
    requested === "advanced" &&
    entitlements.projectDetectionLevel !== "advanced"
  ) {
    throw new ProjectDirectoryError(
      "Advanced project detection requires Projecto Pro.",
      403,
      "project_detection_advanced_locked",
    );
  }

  return requested ?? entitlements.projectDetectionLevel;
}

function ensureProjectQuota(
  existingCount: number,
  incomingCount: number,
  entitlements: DesktopEntitlements,
) {
  if (
    entitlements.maxProjects !== null &&
    existingCount + incomingCount > entitlements.maxProjects
  ) {
    throw new ProjectDirectoryError(
      `Free users can store up to ${entitlements.maxProjects} project directories.`,
      403,
      "project_limit_reached",
    );
  }
}

function ensureBulkImportAccess(entitlements: DesktopEntitlements) {
  if (!entitlements.canBulkImport || !entitlements.canBulkScan) {
    throw new ProjectDirectoryError(
      "Bulk import and bulk scan require Projecto Pro.",
      403,
      "project_bulk_import_locked",
    );
  }
}

export async function getProjectDirectoryAccess(userId: string) {
  const [projects, subscription] = await Promise.all([
    listProjectDirectoriesForUser(userId),
    getEffectiveSubscriptionAccess(userId),
  ]);
  const reconciledProjects = await reconcileProjectDirectoryVisibility(
    projects,
    subscription.entitlements!.maxProjects,
  );

  return {
    projects: reconciledProjects.projects,
    archivedProjects: reconciledProjects.archivedProjects,
    allProjects: reconciledProjects.allProjects,
    archivedProjectCount: reconciledProjects.archivedProjectCount,
    subscription,
    entitlements: subscription.entitlements!,
  };
}

export async function listUserProjectDirectories(userId: string) {
  const access = await getProjectDirectoryAccess(userId);
  return {
    projects: access.projects,
    archivedProjects: access.archivedProjects,
    subscription: access.subscription,
    entitlements: access.entitlements,
    archivedProjectCount: access.archivedProjectCount,
  };
}

async function createUserProjectDirectoryInternal(
  userId: string,
  input: ProjectDirectoryMutationInput,
) {
  const { allProjects, subscription, entitlements, archivedProjectCount } =
    await getProjectDirectoryAccess(userId);
  const directoryPath = normalizeDirectoryPath(input.directoryPath);

  ensureProjectQuota(allProjects.length, 1, entitlements);
  ensureUniqueDirectoryPath(allProjects, directoryPath);
  ensureThemeAccess(input, entitlements);

  const now = nowIso();
  const project: ProjectDirectoryRecord = {
    id: createOpaqueToken(12),
    userId,
    name: deriveProjectName(directoryPath, input.name),
    directoryPath,
    detectionLevel: resolveDetectionLevel(input.detectionLevel, entitlements),
    detectionSummary: trimOrNull(input.detectionSummary),
    themeMode: input.themeMode ?? "dark",
      themePreset: trimOrNull(input.themePreset),
      createdAt: now,
      updatedAt: now,
      lastLaunchedAt: input.lastLaunchedAt ?? null,
      archivedByPlan: false,
      archivedAt: null,
      archivedReason: null,
    };

  await upsertProjectDirectory(project);

  return {
    project,
    subscription,
    entitlements,
    archivedProjectCount,
  };
}

async function bulkImportUserProjectDirectoriesInternal(
  userId: string,
  inputs: ProjectDirectoryMutationInput[],
) {
  const { allProjects, subscription, entitlements, archivedProjectCount } =
    await getProjectDirectoryAccess(userId);

  if (inputs.length === 0) {
    throw new ProjectDirectoryError(
      "At least one project directory is required for bulk import.",
      400,
      "project_bulk_import_empty",
    );
  }

  ensureBulkImportAccess(entitlements);
  ensureProjectQuota(allProjects.length, inputs.length, entitlements);

  const existingPaths = new Set(allProjects.map((project) => canonicalDirectoryPath(project.directoryPath)));
  const incomingPaths = new Set<string>();
  const createdAt = nowIso();
  const importedProjects = inputs.map((input) => {
    const directoryPath = normalizeDirectoryPath(input.directoryPath);

    if (existingPaths.has(canonicalDirectoryPath(directoryPath)) || incomingPaths.has(canonicalDirectoryPath(directoryPath))) {
      throw new ProjectDirectoryError(
        "Bulk import contains duplicate project directory paths.",
        409,
        "project_bulk_import_duplicate",
      );
    }

    ensureThemeAccess(input, entitlements);
    incomingPaths.add(canonicalDirectoryPath(directoryPath));

    return {
      id: createOpaqueToken(12),
      userId,
      name: deriveProjectName(directoryPath, input.name),
      directoryPath,
      detectionLevel: resolveDetectionLevel(input.detectionLevel, entitlements),
      detectionSummary: trimOrNull(input.detectionSummary),
      themeMode: input.themeMode ?? "dark",
      themePreset: trimOrNull(input.themePreset),
      createdAt,
      updatedAt: createdAt,
      lastLaunchedAt: input.lastLaunchedAt ?? null,
      archivedByPlan: false,
      archivedAt: null,
      archivedReason: null,
    } satisfies ProjectDirectoryRecord;
  });

  await upsertProjectDirectories(importedProjects);

  return {
    projects: importedProjects,
    subscription,
    entitlements,
    archivedProjectCount,
  };
}

async function updateUserProjectDirectoryInternal(
  userId: string,
  projectId: string,
  input: ProjectDirectoryMutationInput,
) {
  const [storedProject, access] = await Promise.all([
    getProjectDirectoryById(projectId),
    getProjectDirectoryAccess(userId),
  ]);

  if (!storedProject || storedProject.userId !== userId) {
    throw new ProjectDirectoryError(
      "Project directory was not found.",
      404,
      "project_directory_not_found",
    );
  }

  const { allProjects, subscription, entitlements, archivedProjectCount } = access;
  // Visibility reconciliation can update the archive flags after the parallel read.
  const existing = allProjects.find((project) => project.id === projectId) ?? storedProject;
  const nextDirectoryPath =
    input.directoryPath === undefined
      ? existing.directoryPath
      : normalizeDirectoryPath(input.directoryPath);
  ensureUniqueDirectoryPath(allProjects, nextDirectoryPath, existing.id);
  ensureThemeAccess(input, entitlements);

  const nextThemePreset =
    input.themePreset === undefined
      ? existing.themePreset
      : trimOrNull(input.themePreset);
  if (
    input.themePreset !== undefined &&
    nextThemePreset &&
    !entitlements.canUsePremiumThemes
  ) {
    throw new ProjectDirectoryError(
      "Premium themes require Projecto Pro.",
      403,
      "project_theme_premium_locked",
    );
  }

  const updatedProject: ProjectDirectoryRecord = {
    ...existing,
    name:
      input.name === undefined
        ? existing.name
        : deriveProjectName(nextDirectoryPath, input.name),
    directoryPath: nextDirectoryPath,
    detectionLevel:
      input.detectionLevel === undefined
        ? existing.detectionLevel
        : resolveDetectionLevel(input.detectionLevel, entitlements),
    detectionSummary:
      input.detectionSummary === undefined
        ? existing.detectionSummary
        : trimOrNull(input.detectionSummary),
    themeMode: input.themeMode ?? existing.themeMode,
    themePreset: nextThemePreset,
    lastLaunchedAt:
      input.lastLaunchedAt === undefined
        ? existing.lastLaunchedAt
        : input.lastLaunchedAt,
    archivedByPlan: existing.archivedByPlan,
    archivedAt: existing.archivedAt,
    archivedReason: existing.archivedReason,
    updatedAt: nowIso(),
  };

  await upsertProjectDirectory(updatedProject);

  return {
    project: updatedProject,
    subscription,
    entitlements,
    archivedProjectCount,
  };
}

async function deleteUserProjectDirectoryInternal(
  userId: string,
  projectId: string,
) {
  const existing = await getProjectDirectoryById(projectId);

  if (!existing || existing.userId !== userId) {
    throw new ProjectDirectoryError(
      "Project directory was not found.",
      404,
      "project_directory_not_found",
    );
  }

  await deleteProjectDirectory(projectId);

  return {
    projectId,
  };
}

type ReconciledProjectDirectories = {
  projects: ProjectDirectoryRecord[];
  archivedProjects: ProjectDirectoryRecord[];
  allProjects: ProjectDirectoryRecord[];
  archivedProjectCount: number;
};

function compareProjectRecency(
  left: ProjectDirectoryRecord,
  right: ProjectDirectoryRecord,
) {
  const leftRecency = left.lastLaunchedAt ?? left.updatedAt ?? left.createdAt;
  const rightRecency = right.lastLaunchedAt ?? right.updatedAt ?? right.createdAt;

  if (leftRecency !== rightRecency) {
    return rightRecency.localeCompare(leftRecency);
  }

  if (left.updatedAt !== right.updatedAt) {
    return right.updatedAt.localeCompare(left.updatedAt);
  }

  return right.createdAt.localeCompare(left.createdAt);
}

function applyArchiveState(
  project: ProjectDirectoryRecord,
  shouldArchive: boolean,
  timestamp: string,
  reason: ProjectArchiveReason,
) {
  if (shouldArchive) {
    if (
      project.archivedByPlan &&
      project.archivedReason === reason
    ) {
      return project;
    }

    return {
      ...project,
      archivedByPlan: true,
      archivedAt: project.archivedAt ?? timestamp,
      archivedReason: reason,
    } satisfies ProjectDirectoryRecord;
  }

  if (!project.archivedByPlan && !project.archivedReason) {
    return project;
  }

  return {
    ...project,
    archivedByPlan: false,
    archivedAt: null,
    archivedReason: null,
  } satisfies ProjectDirectoryRecord;
}

export async function reconcileProjectDirectoryVisibilityForUser(userId: string) {
  const subscription = await getEffectiveSubscriptionAccess(userId);
  const projects = await listProjectDirectoriesForUser(userId);

  return reconcileProjectDirectoryVisibility(
    projects,
    subscription.entitlements!.maxProjects,
  );
}

export async function reconcileProjectDirectoryVisibility(
  projects: ProjectDirectoryRecord[],
  maxProjects: number | null,
): Promise<ReconciledProjectDirectories> {
  const timestamp = nowIso();
  const sortedProjects = [...projects].sort(compareProjectRecency);
  const allowedIds =
    maxProjects === null
      ? new Set(sortedProjects.map((project) => project.id))
      : new Set(
          sortedProjects
            .slice(0, maxProjects)
            .map((project) => project.id),
        );

  const reconciled = sortedProjects.map((project) =>
    applyArchiveState(
      project,
      maxProjects !== null && !allowedIds.has(project.id),
      timestamp,
      "free_limit",
    ),
  );

  // Visibility is a derived projection. A read must never write an old full-record snapshot.

  const visibleProjects = reconciled
    .filter((project) => !project.archivedByPlan)
    .sort(compareProjectRecency);
  const archivedProjects = reconciled
    .filter((project) => project.archivedByPlan)
    .sort(compareProjectRecency);

  return {
    projects: visibleProjects,
    archivedProjects,
    allProjects: reconciled,
    archivedProjectCount: archivedProjects.length,
  };
}

export async function createUserProjectDirectory(userId: string, input: ProjectDirectoryMutationInput) {
  return withProjectDirectoryTransaction(userId, () => createUserProjectDirectoryInternal(userId, input));
}

export async function bulkImportUserProjectDirectories(userId: string, inputs: ProjectDirectoryMutationInput[]) {
  return withProjectDirectoryTransaction(userId, () => bulkImportUserProjectDirectoriesInternal(userId, inputs));
}

export async function updateUserProjectDirectory(userId: string, projectId: string, input: ProjectDirectoryMutationInput) {
  return withProjectDirectoryTransaction(userId, () => updateUserProjectDirectoryInternal(userId, projectId, input));
}

export async function deleteUserProjectDirectory(userId: string, projectId: string) {
  return withProjectDirectoryTransaction(userId, () => deleteUserProjectDirectoryInternal(userId, projectId));
}
