import { z } from "zod";

export const projectDirectoryMutationSchema = z.object({
  name: z.string().trim().min(1).optional(),
  directoryPath: z.string().trim().min(1).optional(),
  detectionLevel: z.enum(["basic", "advanced"]).optional(),
  detectionSummary: z.string().trim().nullable().optional(),
  themeMode: z.enum(["light", "dark"]).optional(),
  themePreset: z.string().trim().nullable().optional(),
  lastLaunchedAt: z.string().min(1).nullable().optional(),
});

export const projectDirectoryCreateSchema = projectDirectoryMutationSchema.extend({
  directoryPath: z.string().trim().min(1),
});

export const projectDirectoryBulkImportSchema = z.object({
  projects: z.array(projectDirectoryCreateSchema).min(1),
});

export const projectDirectoryUpdateSchema = projectDirectoryMutationSchema.extend({
  projectId: z.string().min(1),
});

export const projectDirectoryDeleteSchema = z.object({
  projectId: z.string().min(1),
});

export const desktopProjectSessionSchema = z.object({
  desktopSessionToken: z.string().min(1),
  deviceId: z.string().min(1),
});
