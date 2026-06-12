import { afterEach, describe, expect, it } from "vitest";

import {
  buildDesktopUpdateManifest,
  compareDesktopVersions,
  getWindowsInstallerMetadata,
} from "./desktop-update";

const envKeys = [
  "PROJECTO_DESKTOP_LATEST_VERSION",
  "PROJECTO_DESKTOP_RELEASE_TAG",
  "PROJECTO_DESKTOP_SETUP_URL",
  "PROJECTO_DESKTOP_SETUP_FILE",
  "PROJECTO_DESKTOP_SETUP_SHA256",
] as const;

describe("desktop update metadata", () => {
  afterEach(() => {
    for (const key of envKeys) {
      delete process.env[key];
    }
  });

  it("compares desktop versions numerically", () => {
    expect(compareDesktopVersions("1.0.10", "1.0.2")).toBe(1);
    expect(compareDesktopVersions("v1.0.0", "1.0.0")).toBe(0);
    expect(compareDesktopVersions("1.0.0", "1.0.1")).toBe(-1);
  });

  it("marks newer Windows x64 releases as available", () => {
    process.env.PROJECTO_DESKTOP_LATEST_VERSION = "1.0.1";
    process.env.PROJECTO_DESKTOP_RELEASE_TAG = "v1.0.1";
    process.env.PROJECTO_DESKTOP_SETUP_SHA256 = "abc123";

    const manifest = buildDesktopUpdateManifest({
      currentVersion: "1.0.0",
      platform: "win32",
      arch: "x64",
    });

    expect(manifest.updateAvailable).toBe(true);
    expect(manifest.latestVersion).toBe("1.0.1");
    expect(manifest.feedUrl).toBe(
      "https://github.com/aditya9515/Projecto/releases/download/v1.0.1",
    );
    expect(manifest.setupFileName).toBe("Projecto-1.0.1.Setup.exe");
  });

  it("keeps unsupported platforms from receiving Windows updates", () => {
    process.env.PROJECTO_DESKTOP_LATEST_VERSION = "1.0.1";

    const manifest = buildDesktopUpdateManifest({
      currentVersion: "1.0.0",
      platform: "darwin",
      arch: "arm64",
    });

    expect(manifest.supported).toBe(false);
    expect(manifest.updateAvailable).toBe(false);
  });

  it("uses the same metadata for the download page and updater", () => {
    process.env.PROJECTO_DESKTOP_LATEST_VERSION = "1.0.2";
    process.env.PROJECTO_DESKTOP_SETUP_URL =
      "https://example.com/Projecto-1.0.2.Setup.exe";

    const installer = getWindowsInstallerMetadata();
    const manifest = buildDesktopUpdateManifest({
      currentVersion: "1.0.1",
      platform: "win32",
      arch: "x64",
    });

    expect(installer.href).toBe(manifest.setupUrl);
    expect(installer.version).toBe(manifest.latestVersion);
  });
});
