import { describe, expect, it } from "vitest";

import {
  PROJECTO_FIRESTORE_COLLECTIONS,
  parseArgs,
  validateCleanupArgs,
} from "./firestore-cleanup.mjs";

describe("firestore cleanup safeguards", () => {
  it("defaults to a dry run over known Projecto collections", () => {
    const args = parseArgs(["--project", "projecto-ec64b"]);

    expect(args.execute).toBe(false);
    expect(args.collections).toEqual(PROJECTO_FIRESTORE_COLLECTIONS);
    expect(() => validateCleanupArgs(args)).not.toThrow();
  });

  it("requires exact project confirmation for destructive cleanup", () => {
    const args = parseArgs(["--project", "projecto-ec64b", "--execute"]);

    expect(() => validateCleanupArgs(args)).toThrow("--confirm");
  });

  it("rejects collections outside the app schema", () => {
    const args = parseArgs([
      "--project",
      "projecto-ec64b",
      "--collections",
      "users,unexpected",
    ]);

    expect(() => validateCleanupArgs(args)).toThrow("Unsupported collection");
  });
});
