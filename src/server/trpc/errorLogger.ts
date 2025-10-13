import { TRPCError } from "@trpc/server";
import type { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

/**
 * Enhanced error logger for development
 * Logs detailed error information to help with debugging
 */
export function logError(error: unknown, context?: string) {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment) {
    // In production, only log basic error info
    console.error(`[tRPC Error]${context ? ` ${context}:` : ""}`, error);
    return;
  }

  // Development: Detailed logging
  console.group(`🚨 [tRPC Error]${context ? ` ${context}` : ""}`);

  if (error instanceof TRPCError) {
    console.error("Type: TRPCError");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
  } else if (isPrismaError(error)) {
    console.error("Type: Prisma Error");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Meta:", error.meta);
    if (error.clientVersion) {
      console.error("Client Version:", error.clientVersion);
    }
  } else if (error instanceof Error) {
    console.error("Type:", error.constructor.name);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
  } else {
    console.error("Unknown Error:", error);
  }

  console.groupEnd();
}

/**
 * Type guard for Prisma errors
 */
function isPrismaError(error: unknown): error is PrismaClientKnownRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "clientVersion" in error &&
    "meta" in error
  );
}

/**
 * Format Prisma error for user-friendly display
 */
export function formatPrismaError(error: PrismaClientKnownRequestError): string {
  switch (error.code) {
    case "P2002":
      return "A unique constraint violation occurred. This record already exists.";
    case "P2003":
      return "Foreign key constraint failed. Referenced record does not exist.";
    case "P2025":
      return "Record not found.";
    case "P2014":
      return "The change would violate a required relation.";
    case "P2016":
      return "Query interpretation error.";
    case "P2021":
      return "The table does not exist in the database.";
    default:
      return `Database error: ${error.message}`;
  }
}

/**
 * Wrap async function with error logging
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      throw error;
    }
  }) as T;
}