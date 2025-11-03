import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { styled } from "@mui/material/styles";
import { Box, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { DndContext } from "@dnd-kit/core";
import MuiTimetable from "./-MuiTimetable";
import { useTimetableDnD } from "./-hooks/-useTimetableDnd";
import { DrawerRight } from "@/components/Drawer";
import { ExportButton } from "../export/-ExportButton";

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
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.leavingScreen,
  }),
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

function RouteComponent() {
  const { timetableId } = useParams({ from: "/tt/$timetableId/edit/" });
  const [drawerState, setDrawerState] = useState(false);
  const drawerwidth = 300;
  // @ts-ignore allow unused variable
  const { handlers, sensors } = useTimetableDnD();

  const handleDrawerOpen = () => {
    setDrawerState(true);
  };

  const handleDrawerClose = () => {
    setDrawerState(false);
  };

  return (
    <DndContext {...handlers} autoScroll={true} sensors={sensors}>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Export Button Toolbar */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Link to="/tt/$timetableId/export" params={{ timetableId }}>
            <Button
              startIcon={<DownloadIcon />}
              variant="outlined"
              size="medium"
            >
              Bulk Export
            </Button>
          </Link>
          <ExportButton />
        </Box>

        <Main
          drawerState={drawerState}
          drawerwidth={drawerwidth}
          className="main"
        >
          <MuiTimetable handleDrawerOpen={handleDrawerOpen} />
        </Main>
        <DrawerRight
          drawerwidth={drawerwidth}
          handleDrawerClose={handleDrawerClose}
          drawerState={drawerState}
        />
      </Box>
    </DndContext>
  );
}
