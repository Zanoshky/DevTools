
import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

export type AccentColor = "blue" | "green" | "purple" | "red" | "orange" | "pink" | "yellow" | "teal";

export type FontFamily = "jetbrains-mono" | "fira-code" | "source-code-pro" | "ibm-plex-mono" | "space-mono" | "dyslexic";

export type RadiusSize = "0" | "0.25" | "0.5" | "0.75" | "1";

export interface AppearanceSettings {
  mode: ThemeMode;
  accent: AccentColor;
  font: FontFamily;
  radius: RadiusSize;
}

const STORAGE_KEY = "dev-toolbox-appearance";

const DEFAULTS: AppearanceSettings = {
  mode: "system",
  accent: "blue",
  font: "jetbrains-mono",
  radius: "0.75",
};

function getSystemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "system") return getSystemDark();
  return mode === "dark";
}

/** Apply all appearance settings to the document */
function applySettings(settings: AppearanceSettings) {
  if (typeof document === "undefined") return;

  const html = document.documentElement;

  // Mode
  const isDark = resolveIsDark(settings.mode);
  html.classList.toggle("dark", isDark);

  // Accent color — remove all theme-* classes, add the current one
  const accentClasses = ["theme-blue", "theme-green", "theme-purple", "theme-red", "theme-orange", "theme-pink", "theme-yellow", "theme-teal"];
  html.classList.remove(...accentClasses);
  if (settings.accent !== "blue") {
    html.classList.add(`theme-${settings.accent}`);
  }

  // Font
  const fontClasses = ["font-jetbrains-mono", "font-fira-code", "font-source-code-pro", "font-ibm-plex-mono", "font-space-mono", "font-dyslexic"];
  html.classList.remove(...fontClasses);
  html.classList.add(`font-${settings.font}`);

  // Radius
  html.style.setProperty("--radius", `${settings.radius}rem`);
}

function loadSettings(): AppearanceSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old font values to new ones
      if (parsed.font === "inter" || parsed.font === "system" || parsed.font === "mono") {
        parsed.font = "jetbrains-mono";
      }
      return { ...DEFAULTS, ...parsed };
    }
  } catch {
    // ignore
  }
  // Migrate from old "theme" key
  try {
    const oldTheme = localStorage.getItem("theme");
    if (oldTheme === "dark" || oldTheme === "light") {
      return { ...DEFAULTS, mode: oldTheme };
    }
  } catch {
    // ignore
  }
  return DEFAULTS;
}

export function useAppearance() {
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  // Load and apply on mount
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applySettings(loaded);
    setMounted(true);
  }, []);

  // Listen for system theme changes when mode is "system"
  useEffect(() => {
    if (settings.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applySettings(settings);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings]);

  const update = useCallback((partial: Partial<AppearanceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      applySettings(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        // Keep old "theme" key in sync for backward compat
        const isDark = resolveIsDark(next.mode);
        localStorage.setItem("theme", isDark ? "dark" : "light");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    update(DEFAULTS);
  }, [update]);

  return { settings, update, reset, mounted };
}
