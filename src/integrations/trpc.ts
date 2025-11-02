import { createTRPCContext } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import {
  createTRPCClient,
  httpBatchLink,
  loggerLink,
} from "@trpc/client";
import type { TRPCRouter } from "@/server/trpc/routers";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    return `http://localhost:${process.env.PORT ?? 3000}`;
  })();
  return `${base}/api/trpc`;
}

export const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    // loggerLink({
    //   enabled: (opts) =>
    //     (process.env.NODE_ENV === "development" &&
    //       typeof window !== "undefined") ||
    //     (opts.direction === "down" && opts.result instanceof Error),
    // }),
    httpBatchLink({
      transformer: superjson,
      url: getUrl(),
      headers() {
        // Get session token from cookie
        if (typeof document !== "undefined") {
          const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("session="))
            ?.split("=")[1];

          return {
            "x-session-token": token || "",
          };
        }
        return {};
      },
    }),
  ],
});

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<TRPCRouter>();
export type RouterInput = inferRouterInputs<TRPCRouter>;
export type RouterOutput = inferRouterOutputs<TRPCRouter>;
