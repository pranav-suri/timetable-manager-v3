import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Box, CircularProgress } from "@mui/material";
import { useAuthStore } from "@/zustand/authStore";
import { useTRPC } from "@/integrations/trpc";

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Component that requires authentication to render children.
 * Redirects to /login if user is not authenticated.
 * Shows loading spinner while checking authentication status.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const navigate = useNavigate();
  const { user, setUser, clearAuth, getSessionToken } = useAuthStore();
  const trpc = useTRPC();
  
  const sessionToken = getSessionToken();

  // Check if session is valid by fetching current user
  const { data, isLoading, error } = useQuery({
    ...trpc.auth.me.queryOptions(),
    enabled: !!sessionToken && !user, // Only fetch if we have a token but no user data
    retry: false,
  });

  useEffect(() => {
    // If no session token, redirect to login
    if (!sessionToken) {
      navigate({ to: "/login" });
      return;
    }

    // If we got user data, update the store
    if (data) {
      setUser(data);
    }

    // If there was an error (e.g., invalid session), clear auth and redirect
    if (error) {
      clearAuth();
      navigate({ to: "/login" });
    }
  }, [sessionToken, data, error, navigate, setUser, clearAuth]);

  // Show loading spinner while checking auth
  if (isLoading || (!user && sessionToken)) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // If we have a valid session and user data, render children
  if (sessionToken && user) {
    return <>{children}</>;
  }

  // Otherwise, show nothing (will redirect in useEffect)
  return null;
}