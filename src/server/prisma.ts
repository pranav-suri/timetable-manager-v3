import { Prisma, PrismaClient } from "generated/prisma/client";
import sampleDataUpload from "./controllers/sampleData";

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
    const defaultOrg = await prisma.organization.upsert({
      where: { id: "default-org" },
      create: {
        id: "default-org",
        name: "Default Organization",
        slug: "default-organization",
      },
      update: {},
    });

    await sampleDataUpload("ODD", defaultOrg.id);
    await sampleDataUpload("EVEN", defaultOrg.id);
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
