import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

const THEME_KEY = "atmos-theme";

const readStoredTheme = (): ThemeMode | null => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return null;
};

const applyTheme = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (
      readStoredTheme() ??
      (typeof document !== "undefined" &&
      (document.documentElement.dataset.theme === "dark" ||
        document.documentElement.dataset.theme === "light")
        ? (document.documentElement.dataset.theme as ThemeMode)
        : "dark")
    );
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_KEY) return;
      const next = readStoredTheme();
      if (!next) return;
      setTheme(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <button
      className="ghost-btn"
      type="button"
      onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Theme: ${theme}`}
    >
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
