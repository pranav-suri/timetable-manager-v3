import { IconButton, Tooltip } from "@mui/material";
import { useContext } from "react";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { ThemeModeContext } from "@/context/ThemeModeContext";

export default function DarkMode() {
  const { themeMode, setThemeMode } = useContext(ThemeModeContext);
  const handleOnClick = () => {
    setThemeMode(themeMode === "dark" ? "light" : "dark");
  };

  return (
    <Tooltip
      title={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
    >
      <IconButton onClick={handleOnClick}>
        {themeMode === "dark" ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
