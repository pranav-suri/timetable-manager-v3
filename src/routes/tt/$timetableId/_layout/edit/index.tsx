import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import MuiTimetable from "./-MuiTimetable";
import { NavBar } from "@/components/Navbar";
import { DrawerHeader, DrawerRight } from "@/components/Drawer";

export const Route = createFileRoute("/tt/$timetableId/_layout/edit/")({
  component: RouteComponent,
});

const Main = styled("main", {
  shouldForwardProp: (prop) => prop !== "drawerState",
})<{
  drawerState?: boolean;
  drawerwidth: number;
}>(({ theme, drawerState, drawerwidth }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginRight: -drawerwidth,
  ...(drawerState && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  }),
  /**
   * This is necessary to enable the selection of content. In the DOM, the stacking order is determined
   * by the order of appearance. Following this rule, elements appearing later in the markup will overlay
   * those that appear earlier. Since the Drawer comes after the Main content, this adjustment ensures
   * proper interaction with the underlying content.
   */
  position: "relative",
}));

function RouteComponent() {
  const [drawerState, setDrawerState] = useState(false);
  const drawerwidth = 300;

  const handleDrawerOpen = () => {
    setDrawerState(true);
  };

  const handleDrawerClose = () => {
    setDrawerState(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <NavBar handleDrawerClose={handleDrawerClose} />
      <Main
        drawerState={drawerState}
        drawerwidth={drawerwidth}
        className="main"
      >
        <DrawerHeader />
        <MuiTimetable handleDrawerOpen={handleDrawerOpen} />
      </Main>
      <DrawerRight
        drawerwidth={drawerwidth}
        handleDrawerClose={handleDrawerClose}
        drawerState={drawerState}
      />
    </Box>
  );
}
