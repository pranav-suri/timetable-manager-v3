import { Prisma, PrismaClient } from "generated/prisma/client";
import sampleDataUpload from "./controllers/sampleData";
import * as bcrypt from "bcrypt";

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
  // Create a new timetable if it doesn't exist

  // await prisma.timetable.upsert({
  //   create: {
  //     id: "abcde",
  //     name: "Timetable 1",
  //   },
  //   update: {},
  //   where: {
  //     id: "abcde",
  //   },
  // });

  // Inner Join,
  await prisma.timetable.findFirst({
    where: {
      classrooms: {
        some: {},
      },
    },
  });

  await prisma.timetable.findFirst();
  console.time(": Time taken for data upload");
  try {
    // Get or create default organization for sample data
    try {
      await prisma.organization.upsert({
        where: { id: "default-org" },
        create: {
          id: "default-org",
          name: "Default Organization",
          slug: "default-organization",
        },
        update: {},
      });
    } catch (e) {
      console.error(e);
    }

    const defaultPassword = "ChangeMe123!";
    const passwordHash = await bcrypt.hash(defaultPassword, BCRYPT_ROUNDS);
    try {
      await prisma.user.create({
        data: {
          email: "admin@example.com",
          passwordHash,
          firstName: "Admin",
          lastName: "User",
          role: "ADMIN",
          isActive: true,
          organizationId: "default-org",
        },
      });
      console.log(`✅ Created admin user: ${"admin@example.com"}\n`);
    } catch (e) {
      console.error(e);
    }

    await sampleDataUpload("ODD", "default-org");
    await sampleDataUpload("EVEN", "default-org");
    return;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        console.log("Unique constraint violation. Sample Data already exists.");
      } else {
        console.error(e);
      }
    }
  } finally {
    console.timeEnd(": Time taken for data upload");
  }
}

main();
