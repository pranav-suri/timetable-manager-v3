import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { logError } from "./errorLogger";
import type { UserRole } from "generated/prisma/client";
import { prisma } from "@/server/prisma";

export function createTrpcContext() {
  return {
    prisma,
  };
}

export type TrpcContext = Awaited<ReturnType<typeof createTrpcContext>> & {
  session?: {
    userId: string;
    organizationId: string;
    userRole: UserRole;
    userEmail: string;
  };
  sessionToken?: string;
};

// Context is populated in /api/trpc.$.tsx file by the fetchRequestHandler
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const isDevelopment = process.env.NODE_ENV === "development";

    // Log error to console during development
    if (isDevelopment) {
      const procedurePath = shape.data.path || "unknown";
      logError(error, `Procedure: ${procedurePath}`);
    }

    return {
      ...shape,
      data: {
        ...shape.data,
        // In development, include full error details
        ...(isDevelopment && {
          stack: error.stack,
          cause: error.cause,
          originalError:
            error.cause instanceof Error
              ? {
                  name: error.cause.name,
                  message: error.cause.message,
                  stack: error.cause.stack,
                }
              : undefined,
        }),
      },
    };
  },
});

export const createTRPCRouter = t.router;

const loggingMiddleware = t.middleware(async (opts) => {
  const start = Date.now();
  const result = await opts.next();
  const durationMs = Date.now() - start;
  // durationMs > 100 ? console.warn("SLOW QUERY:", opts.path, opts.type, durationMs) : null;
  // result.ok
  //   ? console.log("INFO:", opts.path, opts.type, durationMs)
  //   : console.log("ERROR:", opts.path, opts.type, durationMs);
  return result;
});
const baseProcedure = t.procedure.use(loggingMiddleware);

export const publicProcedure = baseProcedure;

// Authentication middleware
export const authedProcedure = baseProcedure.use(async (opts) => {
  const sessionToken = opts.ctx.sessionToken;

  if (!sessionToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No session token provided",
    });
  }

  // Validate session
  const session = await opts.ctx.prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: {
        include: { organization: true },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired session",
    });
  }

  // Check if user is active
  if (!session.user.isActive) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User account is inactive",
    });
  }

  // Check if organization is active
  if (!session.user.organization.isActive) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization is inactive",
    });
  }

  return opts.next({
    ctx: {
      ...opts.ctx,
      session: {
        userId: session.userId,
        organizationId: session.user.organizationId,
        userRole: session.user.role,
        userEmail: session.user.email,
      },
      sessionToken,
    },
  });
});

// Admin-only middleware
export const adminProcedure = authedProcedure.use((opts) => {
  if (opts.ctx.session.userRole !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return opts.next();
});

// Editor or Admin middleware
export const editorProcedure = authedProcedure.use((opts) => {
  const allowedRoles: UserRole[] = ["ADMIN", "EDITOR"];
  if (!allowedRoles.includes(opts.ctx.session.userRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Editor or Admin access required",
    });
  }
  return opts.next();
});
