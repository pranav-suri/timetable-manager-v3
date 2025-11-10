import { Prisma, PrismaClient } from "generated/prisma/client";
import * as bcrypt from "bcrypt";
import sampleDataUpload from "./controllers/sampleData";
import { env } from "src/env";

const BCRYPT_ROUNDS = 12;

// Declaring prisma as global to prevent multiple instances during hot reload
declare global {
  var prisma: PrismaClient | undefined;
}

// prevent multiple instances in dev / hot-reload
export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    // log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

async function main() {
  function isPrismaUniqueError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }

  if (env.DATABASE_URL.startsWith("file:")) {
    // await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
    // await prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000;");
    // console.log("✅ SQLite WAL mode enabled with 5s busy timeout");
  }

  await prisma.timetable.findFirst();

  console.time(": Time taken for data upload");
  // Get or create default organization for sample data
  await prisma.organization
    .upsert({
      where: { id: "default-org" },
      create: {
        id: "default-org",
        name: "Default Organization",
        slug: "default-organization",
      },
      update: {},
    })
    .catch((e) => {
      if (isPrismaUniqueError(e))
        console.log(`✅ Organization already exists: ${"default-org"}`);
      else console.error("Error creating organization:", e);
    });

  const defaultPassword = "12345678";
  const passwordHash = await bcrypt.hash(defaultPassword, BCRYPT_ROUNDS);

  await prisma.user
    .upsert({
      where: { email: "admin@example.com" },
      update: { passwordHash },
      create: {
        email: "admin@example.com",
        passwordHash,
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        isActive: true,
        organizationId: "default-org",
      },
    })
    .then((user) => console.log(`✅ Created admin user: ${user.email}`))
    .catch((e) => {
      if (isPrismaUniqueError(e))
        console.log(`✅ Admin user already exists: ${"admin@example.com"}`);
      else console.error("Error creating admin user:", e);
    });

  await sampleDataUpload("ODD", "default-org").catch((e) => {
    if (isPrismaUniqueError(e))
      console.log("✅ Unique constraint. ODD Sample Data already exists.");
    else console.error("Error uploading ODD sample data:", e);
  });

  await sampleDataUpload("EVEN", "default-org").catch((e) => {
    if (isPrismaUniqueError(e))
      console.log("✅ Unique constraint. EVEN Sample Data already exists.");
    else console.error("Error uploading EVEN sample data:", e);
  });

  await sampleDataUpload("2026 EVEN", "default-org", true).catch((e) => {
    if (isPrismaUniqueError(e))
      console.log("✅ Unique constraint. 2025 EVEN Sample Data already exists.")
    else console.error("Error updating 2025 EVEN sample data.", e);
  })
  console.timeEnd(": Time taken for data upload");
}

// Graceful shutdown for development
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}, disconnecting Prisma...`);
  try {
    await prisma.$disconnect();
    console.log("Prisma disconnected successfully");
  } catch (error) {
    console.error("Error disconnecting Prisma:", error);
  }

  // Give other cleanup operations a moment
  setTimeout(() => {
    process.exit(0);
  }, 100);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle program failures - ensure Prisma disconnects even on crashes
process.on("uncaughtException", async (error) => {
  console.error("💥 Uncaught Exception:", error);
  try {
    await prisma.$disconnect();
  } catch (disconnectError) {
    console.error("❌ Error disconnecting on crash:", disconnectError);
  }
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  try {
    await prisma.$disconnect();
  } catch (disconnectError) {
    console.error("❌ Error disconnecting on rejection:", disconnectError);
  }
  process.exit(1);
});

// Only run main() during development, not during build/prerendering
// During prerendering, the database may not exist, so skip initialization
if (process.env.NODE_ENV !== "production") {
  prisma.$connect().then(() => {
    console.log("✅ Prisma connected to the database successfully");
  });
  main();
}
// @ts-ignore Check the runtime environment
if (typeof Bun !== "undefined") {
  // Bun environment
  console.log("🍔 Running in Bun environment.");
} else {
  console.log("🚀 Running in Non Bun environment, multi threading disabled.");
}
