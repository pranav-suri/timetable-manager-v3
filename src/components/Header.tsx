import { Link, useNavigate } from "@tanstack/react-router";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Divider,
  ListItemIcon,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { useState, useContext } from "react";
import { useAuthStore } from "@/zustand/authStore";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc";
import { ThemeModeContext } from "@/context/ThemeModeContext";
import { DarkMode as DarkModeSwitch } from "@/components/Buttons";

export default function Header() {
  const { user, logout: localLogout } = useAuthStore();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { themeMode } = useContext(ThemeModeContext);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { mutate: logout } = useMutation({
    ...trpc.auth.logout.mutationOptions(),
    onSuccess: () => {
      localLogout();
      navigate({ to: "/login" });
    },
  });

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  if (!user) {
    return null;
  }

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
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Timetable Manager
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button color="inherit" component={Link} to="/tt">
            Timetables
          </Button>

          <DarkModeSwitch />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2">
              {user.firstName} {user.lastName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                px: 1,
                py: 0.25,
                bgcolor: "rgba(255,255,255,0.2)",
                borderRadius: 1,
              }}
            >
              {user.role}
            </Typography>
          </Box>

          <IconButton
            size="large"
            aria-label="account menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user.firstName[0]}
              {user.lastName[0]}
            </Avatar>
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                {user.organizationName}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
