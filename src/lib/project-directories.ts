import {
  deleteProjectDirectory,
  getProjectDirectoryById,
  listProjectDirectoriesForUser,
  listSubscriptionsForUser,
  upsertProjectDirectory,
} from "@/lib/firestore";
import { createOpaqueToken, nowIso } from "@/lib/security";
import {
  normalizeSubscription,
  selectPrimarySubscription,
  withPlanEntitlements,
} from "@/lib/subscriptions";
import type {
  DesktopEntitlements,
  ProjectDetectionLevel,
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
      project.directoryPath === directoryPath && project.id !== excludeId,
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
  const [projects, subscriptions] = await Promise.all([
    listProjectDirectoriesForUser(userId),
    listSubscriptionsForUser(userId),
  ]);
  const subscription = withPlanEntitlements(
    normalizeSubscription(selectPrimarySubscription(subscriptions)),
  );

  return {
    projects: [...projects].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    ),
    subscription,
    entitlements: subscription.entitlements!,
  };
}

export async function listUserProjectDirectories(userId: string) {
  return getProjectDirectoryAccess(userId);
}

export async function createUserProjectDirectory(
  userId: string,
  input: ProjectDirectoryMutationInput,
) {
  const { projects, subscription, entitlements } =
    await getProjectDirectoryAccess(userId);
  const directoryPath = normalizeDirectoryPath(input.directoryPath);

  ensureProjectQuota(projects.length, 1, entitlements);
  ensureUniqueDirectoryPath(projects, directoryPath);
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
  };

  await upsertProjectDirectory(project);

  return {
    project,
    subscription,
    entitlements,
  };
}

export async function bulkImportUserProjectDirectories(
  userId: string,
  inputs: ProjectDirectoryMutationInput[],
) {
  const { projects, subscription, entitlements } =
    await getProjectDirectoryAccess(userId);

  if (inputs.length === 0) {
    throw new ProjectDirectoryError(
      "At least one project directory is required for bulk import.",
      400,
      "project_bulk_import_empty",
    );
  }

  ensureBulkImportAccess(entitlements);
  ensureProjectQuota(projects.length, inputs.length, entitlements);

  const existingPaths = new Set(projects.map((project) => project.directoryPath));
  const incomingPaths = new Set<string>();
  const createdAt = nowIso();
  const importedProjects = inputs.map((input) => {
    const directoryPath = normalizeDirectoryPath(input.directoryPath);

    if (existingPaths.has(directoryPath) || incomingPaths.has(directoryPath)) {
      throw new ProjectDirectoryError(
        "Bulk import contains duplicate project directory paths.",
        409,
        "project_bulk_import_duplicate",
      );
    }

    ensureThemeAccess(input, entitlements);
    incomingPaths.add(directoryPath);

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
    } satisfies ProjectDirectoryRecord;
  });

  await Promise.all(importedProjects.map((project) => upsertProjectDirectory(project)));

  return {
    projects: importedProjects,
    subscription,
    entitlements,
  };
}

export async function updateUserProjectDirectory(
  userId: string,
  projectId: string,
  input: ProjectDirectoryMutationInput,
) {
  const [existing, access] = await Promise.all([
    getProjectDirectoryById(projectId),
    getProjectDirectoryAccess(userId),
  ]);

  if (!existing || existing.userId !== userId) {
    throw new ProjectDirectoryError(
      "Project directory was not found.",
      404,
      "project_directory_not_found",
    );
  }

  const { projects, subscription, entitlements } = access;
  const nextDirectoryPath =
    input.directoryPath === undefined
      ? existing.directoryPath
      : normalizeDirectoryPath(input.directoryPath);

  if (
    nextDirectoryPath !== existing.directoryPath &&
    !entitlements.canChangeProjectDirectories
  ) {
    throw new ProjectDirectoryError(
      "Changing project directories requires Projecto Pro.",
      403,
      "project_directory_change_locked",
    );
  }

  ensureUniqueDirectoryPath(projects, nextDirectoryPath, existing.id);
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
    updatedAt: nowIso(),
  };

  await upsertProjectDirectory(updatedProject);

  return {
    project: updatedProject,
    subscription,
    entitlements,
  };
}

export async function deleteUserProjectDirectory(
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
