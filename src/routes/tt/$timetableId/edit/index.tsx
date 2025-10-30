import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import MuiTimetable from "./-MuiTimetable";
import { DrawerRight } from "@/components/Drawer";
import { moveLectureSlot } from "./-components/utils";
import type {
  DndContextProps,
  DragStartEvent,
  DragEndEvent,
} from "node_modules/@dnd-kit/core/dist";
import { DndContext, useSensor, PointerSensor } from "@dnd-kit/core";
import { useCollections } from "src/db-collections/providers/useCollections";

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

  const { handlers } = useTimetableDnD();

  const handleDrawerOpen = () => {
    setDrawerState(true);
  };

  const handleDrawerClose = () => {
    setDrawerState(false);
  };

  return (
    <DndContext
      {...handlers}
      // autoScroll={false}
      // sensors={sensors}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
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

export function useTimetableDnD() {
  const { lectureSlotCollection } = useCollections();
  type Handlers = Pick<
    DndContextProps,
    "onDragStart" | "onDragEnd" | "onDragCancel"
  >; // Done to ensure type safety of props, add more handler to type as required

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 0 },
  });

  // @ts-ignore Ignore unused variable warning
  const onDragStart = (event: DragStartEvent) => {
    // You can add any logic needed when dragging starts
  };

  // @ts-ignore Ignore unused variable warning
  const onDragCancel = (event: DragCancelEvent) => {
    // You can add any logic needed when dragging is canceled
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    moveLectureSlot(
      lectureSlotCollection,
      active.id.toString(),
      over.id.toString(),
    );
  };

  return {
    sensors: [pointerSensor],
    handlers: { onDragStart, onDragEnd, onDragCancel } satisfies Handlers,
  };
}
