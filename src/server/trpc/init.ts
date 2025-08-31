import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { prisma } from "@/server/prisma";

export function createContext() {
  return {
    prisma,
  };
}

export type TrpcContext = Awaited<ReturnType<typeof createContext>> & {
  session?: string;
};

// Context is populated in /api/trpc.$.tsx file by the fetchRequestHandler
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const authedProcedure = t.procedure.use((opts) => {
  opts.ctx.session = "abc";

  return opts.next({
    ctx: {
      ...opts.ctx,
      session: opts.ctx.session,
    },
  });
});
