// src/zustand/uiStore.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ThemeMode = "light" | "dark";

interface UiState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

// Function to get the system preference
const getSystemTheme = (): ThemeMode => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
};

export const useUiStore = create<UiState>()(
  // Persist the theme mode in local storage
  persist(
    (set) => ({
      // Initialize with system preference or default to 'light'
      themeMode: getSystemTheme(),
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleThemeMode: () =>
        set((state) => ({
          themeMode: state.themeMode === "light" ? "dark" : "light",
        })),
    }),
    {
      name: "ui-settings-storage", // name of the item in storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default the 'localStorage' is used
    },
  ),
);
