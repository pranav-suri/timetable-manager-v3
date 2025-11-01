import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useAuthStore } from "@/zustand/authStore";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      // If authenticated, redirect to timetables dashboard
      navigate({ to: "/tt" });
    } else {
      // If not authenticated, redirect to login
      navigate({ to: "/login" });
    }
  }, [user, navigate]);

  // Show loading state while redirecting
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <CircularProgress />
    </Box>
  );
}
