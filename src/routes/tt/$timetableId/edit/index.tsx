import { createFileRoute } from "@tanstack/react-router";
import { memo, useCallback, useState } from "react";
import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import MuiTimetable from "./-MuiTimetable";
import { NavBar } from "@/components/Navbar";

export const Route = createFileRoute("/tt/$timetableId/edit/")({
  component: RouteComponent,
});

const Main = styled("main", {
  shouldForwardProp: (prop) => prop !== "drawerState",
})<{
  drawerState?: boolean;
  drawerwidth: number;
}>(({ theme, drawerState, drawerwidth }) => ({
  flexGrow: 1,
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // marginRight: drawerwidth,
  ...(drawerState && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: drawerwidth,
  }),
  /**
   * This is necessary to enable the selection of content. In the DOM, the stacking order is determined
   * by the order of appearance. Following this rule, elements appearing later in the markup will overlay
   * those that appear earlier. Since the Drawer comes after the Main content, this adjustment ensures
   * proper interaction with the underlying content.
   */
  position: "relative",
}));

const MuiTimetableMemoized = memo(MuiTimetable);

function RouteComponent() {
  const [drawerState, setDrawerState] = useState(false);
  const [_selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const drawerwidth = 300;

  const handleDrawerOpen = useCallback(() => {
    setDrawerState(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerState(false);
  }, []);

  return (
    <Box sx={{ display: "flex" }}>
      {/* <NavBar handleDrawerClose={handleDrawerClose} /> */}
      <Main
        drawerState={drawerState}
        drawerwidth={drawerwidth}
        className="main"
      >
        <MuiTimetableMemoized
          handleDrawerOpen={handleDrawerOpen}
          setSelectedSlotId={setSelectedSlotId}
        />
      </Main>
    </Box>
  );
}
