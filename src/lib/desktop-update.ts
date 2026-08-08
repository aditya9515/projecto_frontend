const DEFAULT_DESKTOP_VERSION = "1.0.5";
const DEFAULT_WINDOWS_INSTALLER_SHA256 =
  "4FD3BE04657A25D04E0157E3136419B800DC093FBB52ADFA711989FE5417AFBA";
const DEFAULT_WINDOWS_INSTALLER_SIZE = "139.5 MB";
const DEFAULT_RELEASE_NOTES =
  "Projecto 1.0.5 improves mapped Windows Terminal stop cleanup, refreshes the desktop interface, fixes control contrast, and smooths common controls and navigation.";

export type DesktopUpdateManifest = {
  appName: "Projecto";
  platform: string;
  arch: string;
  supported: boolean;
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  mandatory: boolean;
  minimumSupportedVersion?: string;
  releaseDate?: string;
  releaseNotes: string;
  feedUrl?: string;
  setupUrl?: string;
  setupFileName?: string;
  setupSha256?: string;
  setupSize?: string;
  checkedAt: string;
};

export type WindowsInstallerMetadata = {
  href: string;
  fileName: string;
  sha256: string;
  size: string;
  version: string;
};

function cleanVersion(value: string | undefined, fallback: string) {
  const candidate = value?.trim();
  return candidate && candidate.length > 0 ? candidate.replace(/^v/i, "") : fallback;
}

function getReleaseTag(version: string) {
  return process.env.PROJECTO_DESKTOP_RELEASE_TAG?.trim() || `v${version}`;
}

function getReleaseBaseUrl(version: string) {
  const explicitBaseUrl = process.env.PROJECTO_DESKTOP_RELEASE_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }

  const tag = getReleaseTag(version);
  return `https://github.com/aditya9515/Projecto/releases/download/${tag}`;
}

export function compareDesktopVersions(left: string, right: string) {
  const leftParts = left.replace(/^v/i, "").split(/[.-]/);
  const rightParts = right.replace(/^v/i, "").split(/[.-]/);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? "0";
    const rightPart = rightParts[index] ?? "0";
    const leftNumber = Number.parseInt(leftPart, 10);
    const rightNumber = Number.parseInt(rightPart, 10);
    const leftComparable = Number.isNaN(leftNumber) ? leftPart : leftNumber;
    const rightComparable = Number.isNaN(rightNumber) ? rightPart : rightNumber;

    if (leftComparable === rightComparable) {
      continue;
    }

    if (
      typeof leftComparable === "number" &&
      typeof rightComparable === "number"
    ) {
      return leftComparable > rightComparable ? 1 : -1;
    }

    return String(leftComparable).localeCompare(String(rightComparable));
  }

  return 0;
}

export function getWindowsInstallerMetadata(): WindowsInstallerMetadata {
  const version = cleanVersion(
    process.env.PROJECTO_DESKTOP_LATEST_VERSION,
    DEFAULT_DESKTOP_VERSION,
  );
  const releaseBaseUrl = getReleaseBaseUrl(version);
  const fileName =
    process.env.PROJECTO_DESKTOP_SETUP_FILE?.trim() ||
    `Projecto-${version}.Setup.exe`;

  return {
    href:
      process.env.PROJECTO_DESKTOP_SETUP_URL?.trim() ||
      `${releaseBaseUrl}/${fileName}`,
    fileName,
    sha256:
      process.env.PROJECTO_DESKTOP_SETUP_SHA256?.trim() ||
      DEFAULT_WINDOWS_INSTALLER_SHA256,
    size:
      process.env.PROJECTO_DESKTOP_SETUP_SIZE?.trim() ||
      DEFAULT_WINDOWS_INSTALLER_SIZE,
    version,
  };
}

export function buildDesktopUpdateManifest(input: {
  currentVersion?: string;
  platform?: string;
  arch?: string;
}): DesktopUpdateManifest {
  const latestVersion = cleanVersion(
    process.env.PROJECTO_DESKTOP_LATEST_VERSION,
    DEFAULT_DESKTOP_VERSION,
  );
  const currentVersion = cleanVersion(input.currentVersion, "0.0.0");
  const platform = input.platform?.trim() || "win32";
  const arch = input.arch?.trim() || "x64";
  const isWindows = platform === "win32" || platform === "windows";
  const isSupported = isWindows && arch === "x64";
  const releaseBaseUrl = getReleaseBaseUrl(latestVersion);
  const installer = getWindowsInstallerMetadata();
  const minimumSupportedVersion = cleanVersion(
    process.env.PROJECTO_DESKTOP_MINIMUM_VERSION,
    DEFAULT_DESKTOP_VERSION,
  );
  const updateAvailable =
    isSupported && compareDesktopVersions(latestVersion, currentVersion) > 0;
  const mandatory =
    isSupported &&
    compareDesktopVersions(minimumSupportedVersion, currentVersion) > 0;

  return {
    appName: "Projecto",
    platform,
    arch,
    supported: isSupported,
    currentVersion,
    latestVersion,
    updateAvailable,
    mandatory,
    minimumSupportedVersion,
    releaseDate: process.env.PROJECTO_DESKTOP_RELEASE_DATE?.trim() || undefined,
    releaseNotes:
      process.env.PROJECTO_DESKTOP_RELEASE_NOTES?.trim() ||
      DEFAULT_RELEASE_NOTES,
    feedUrl:
      process.env.PROJECTO_DESKTOP_FEED_URL?.trim() || releaseBaseUrl,
    setupUrl: installer.href,
    setupFileName: installer.fileName,
    setupSha256: installer.sha256,
    setupSize: installer.size,
    checkedAt: new Date().toISOString(),
  };
}
