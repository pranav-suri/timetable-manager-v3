import React, { createContext } from "react";
import { ThemeProvider, createTheme } from "@mui/material";
import { useUiStore } from "src/zustand/uiStore";
import type { PaletteMode } from "@mui/material";

type ThemeModeContextType = {
  themeMode: PaletteMode;
  setThemeMode: React.Dispatch<React.SetStateAction<PaletteMode>>;
};

const ThemeModeContext = createContext<ThemeModeContextType>({
  themeMode: "dark",
  setThemeMode: () => {},
});

const getTheme = (mode: PaletteMode) => {
  return createTheme({
    palette: {
      mode,
      ...(mode === "light"
        ? {
            // light mode
            primary: {
              main: "#6DBF6F",
            },
            secondary: {
              main: "#5151d4",
            },
          }
        : {
            // dark mode
            primary: {
              main: "#509a52",
            },
            secondary: {
              main: "#5f5fff",
            },
          }),
    },
  });
};

const ThemeModeContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { themeMode, setThemeMode } = useUiStore(); // zustand store
  const setThemeModeWrapper = setThemeMode as any; // we pass zustand function instead of React useState

  return (
    <ThemeModeContext.Provider
      // Required Wrapper to pass zustand function to context
      // it required Dispatch functions
      value={{ themeMode, setThemeMode: setThemeModeWrapper }}
    >
      <ThemeProvider theme={getTheme(themeMode)}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export { ThemeModeContext, ThemeModeContextProvider };
