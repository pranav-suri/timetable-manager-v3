import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import MuiTimetable from "./-MuiTimetable";
import { useTRPC } from "@/integrations/trpc";
import { NavBar } from "@/components/Navbar";

export const Route = createFileRoute("/timetable/")({
  component: TimetableCombined,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.timetable.getAny.queryOptions(),
    );
  },
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

export default function TimetableCombined() {
  const trpc = useTRPC();
  const { data: timetable } = useQuery(trpc.timetable.getAny.queryOptions());
  const [drawerState, setDrawerState] = useState(false);
  const [_selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
    null,
  );

  // if (timetable) console.log("Timetable data:", timetable);

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
        {timetable && (
          <MuiTimetable
            timetableData={timetable}
            handleDrawerOpen={handleDrawerOpen}
            setSelectedSlotIndex={setSelectedSlotIndex}
          />
        )}
      </Main>
    </Box>
  );
}
