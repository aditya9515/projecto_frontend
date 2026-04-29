export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "projecto-theme";
export const DEFAULT_THEME_MODE: ThemeMode = "dark";

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}
