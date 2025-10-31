import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { trpcRouter } from "@/server/trpc/routers";
import { createContext } from "@/server/trpc/init";

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    req: request,
    router: trpcRouter,
    endpoint: "/api/trpc",
    createContext: () => {
      // Extract session token from cookie or header
      const sessionToken =
        request.headers.get("x-session-token") ||
        request.headers
          .get("cookie")
          ?.split("; ")
          .find((row) => row.startsWith("session="))
          ?.split("=")[1];

      return {
        ...createContext(),
        sessionToken,
      };
    },
  });
}

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});
