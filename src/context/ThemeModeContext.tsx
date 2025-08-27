import React, { createContext, useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material'
import type { PaletteMode } from '@mui/material'

type ThemeModeContextType = {
  themeMode: PaletteMode
  setThemeMode: React.Dispatch<React.SetStateAction<PaletteMode>>
}

const ThemeModeContext = createContext<ThemeModeContextType>({
  themeMode: 'dark',
  setThemeMode: () => {},
})

const getTheme = (mode: PaletteMode) => {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? { // light mode
            primary: {
              main: '#6DBF6F',
            },
            secondary: {
              main: '#5151d4',
            },
          }
        : { // dark mode
            primary: {
              main: '#509a52',
            },
            secondary: {
              main: '#5f5fff',
            },
          }),
    },
  })
}

const ThemeModeContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeMode] = useState<PaletteMode>('light')

  return (
    <ThemeModeContext.Provider value={{ themeMode, setThemeMode }}>
      <ThemeProvider theme={getTheme(themeMode)}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

export { ThemeModeContext, ThemeModeContextProvider }
