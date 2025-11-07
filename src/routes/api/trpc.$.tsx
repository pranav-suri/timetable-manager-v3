import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { trpcRouter } from "@/server/trpc/routers";
import { createTrpcContext } from "@/server/trpc/init";

async function handler({ request }: { request: Request }) {
  const start = Date.now();
  const response = await fetchRequestHandler({
    req: request,
    router: trpcRouter,
    endpoint: "/api/trpc",
    createContext: () => {
      const sessionToken =
        request.headers.get("x-session-token") ||
        request.headers
          .get("cookie")
          ?.split("; ")
          .find((row) => row.startsWith("session="))
          ?.split("=")[1];

      return {
        ...createTrpcContext(),
        sessionToken,
      };
    },
  });

  const durationMs = Date.now() - start;
  const path = request.url.split("/api/trpc")[1]?.split("?")[0] || "unknown";
  // console.log(`[TRPC] URL: ${path}, Duration: ${durationMs}ms`);

  return response;
}

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      DELETE: handler,
      PATCH: handler,
    },
  },
});
