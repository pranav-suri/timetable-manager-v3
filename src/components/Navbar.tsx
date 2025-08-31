import { useContext } from "react";
import { AppBar, Toolbar } from "@mui/material";
import { ThemeModeContext } from "@/context/ThemeModeContext";
import {
  // ToggleAllData as AllDataSwitch,
  DarkMode as DarkModeSwitch,
} from "@/components/Buttons";

type NavbarProps = {
  handleDrawerClose: () => void;
};

export const NavBar = ({ handleDrawerClose }: NavbarProps) => {
  // TODO: #7 @MatricalDefunkt Implement the ability to select an academic year, batch, division and thus a timetable
  // TODO: #8 @MatricalDefunkt Add the feature to remove selected values if a previous value is changed
  const { themeMode } = useContext(ThemeModeContext);
  return (
    <AppBar
      position="fixed"
      sx={{
        padding: "0.5rem",
        backdropFilter: "blur(16px)",
        backgroundColor: `hsla(0, 0%, ${themeMode === "dark" ? "30%" : "60%"}, 50%)`,
      }}
      color="transparent"
    >
      <Toolbar>
        <button onClick={handleDrawerClose}>Close Drawer</button>
        {/* <TimetableTypeButton />
                <AcademicYearButton />
                <TeacherButton />
                <ClassroomButton />
                <BatchButton />
                <DepartmentButton />
                <DivisionButton /> */}
        {/* <ViewButton /> */}
        {/* Spacer element to push the next elements to the right */}
        <div style={{ flexGrow: 1 }}></div>
        {/* <GenerateButton />
                <PrintButton pdfComponent={pdfComponent} /> */}
        {/* <AllDataSwitch /> */}
        <DarkModeSwitch />
      </Toolbar>
    </AppBar>
  );
};
