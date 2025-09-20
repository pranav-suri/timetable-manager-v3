import { styled, useTheme } from "@mui/material/styles";
import { Drawer, IconButton } from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import React from "react";

export const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-start",
}));

export function DrawerRight({
  drawerwidth,
  handleDrawerClose,
  drawerState,
  setSelectedSlotId,
}: {
  drawerwidth: number;
  handleDrawerClose: () => void;
  drawerState: boolean;
  setSelectedSlotId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const theme = useTheme();

  return (
    <Drawer
      sx={{
        width: drawerwidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerwidth,
        },
      }}
      variant="persistent"
      anchor="right"
      open={drawerState}
    >
      <DrawerHeader>
        <IconButton
          onClick={() => {
            handleDrawerClose();
            setSelectedSlotId(null);
          }}
        >
          {theme.direction === "rtl" ? (
            <ChevronLeftIcon />
          ) : (
            <ChevronRightIcon />
          )}
        </IconButton>
      </DrawerHeader>
    </Drawer>
  );
}
