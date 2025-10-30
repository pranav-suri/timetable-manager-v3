import { TRPCClientError } from "@trpc/client";
import type { QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../zustand/authStore";

/**
 * Checks if an error is a session/auth error from tRPC
 */
export function isSessionError(error: unknown): error is TRPCClientError<any> {
  if (error instanceof TRPCClientError) {
    const message = error.message.toLowerCase();
    return (
      (message.includes("invalid") && message.includes("session")) ||
      (message.includes("expired") && message.includes("session")) ||
      message.includes("unauthorized") ||
      error.data?.code === "UNAUTHORIZED"
    );
  }
  return false;
}

/**
 * Configures QueryClient to globally handle session errors
 * Applies to all queries and mutations in collections
 *
 * Usage: Call this in CollectionsProvider or at app initialization
 */
export function configureQueryClientSessionErrorHandler(
  queryClient: QueryClient,
): void {
  // Subscribe to query cache for errors
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === "updated" && event.action.type === "error") {
      handleSessionErrorIfNeeded(event.action.error);
    }
  });

  // Subscribe to mutation cache for errors
  queryClient.getMutationCache().subscribe((event) => {
    if (event.type === "updated" && event.action.type === "error") {
      handleSessionErrorIfNeeded(event.action.error);
    }
  });
}

/**
 * Checks and handles session errors without re-throwing
 * Used by QueryClient cache subscribers
 */
function handleSessionErrorIfNeeded(error: unknown): void {
  if (isSessionError(error)) {
    console.warn(
      "Session error detected in QueryClient, clearing authentication",
    );
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
  }
}
