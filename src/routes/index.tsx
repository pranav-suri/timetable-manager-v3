import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Box, CircularProgress } from "@mui/material";
import { useAuthStore } from "@/zustand/authStore";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (user)
    return <Navigate to="/tt" />; // Redirect to timetables if authenticated
  else return <Navigate to="/login" />; // Redirect to login if not authenticated

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
