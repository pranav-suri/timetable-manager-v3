import { PrismaClient } from "generated/prisma/client";
import * as bcrypt from "bcrypt";
import "dotenv/config";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function migrateToMultiTenancy() {
  console.log("🚀 Starting multi-tenancy migration...\n");

  try {
    // Step 1: Create default organization
    console.log("📋 Step 1: Creating default organization...");
    const defaultOrg = await prisma.organization.create({
      data: {
        id: "default-org",
        name: "Default Organization",
        slug: "default",
        email: "admin@example.com",
        isActive: true,
      },
    });
    console.log(
      `✅ Created organization: ${defaultOrg.name} (${defaultOrg.id})\n`,
    );

    // Step 2: Update all existing timetables
    console.log("📋 Step 2: Migrating existing timetables...");
    const timetableCount = await prisma.timetable.count();

    if (timetableCount > 0) {
      await prisma.timetable.updateMany({
        data: {
          organizationId: defaultOrg.id,
        },
      });
      console.log(
        `✅ Migrated ${timetableCount} timetables to default organization\n`,
      );
    } else {
      console.log("ℹ️  No existing timetables found\n");
    }

    // Step 3: Create default admin user
    console.log("📋 Step 3: Creating default admin user...");
    const defaultPassword = "ChangeMe123!";
    const passwordHash = await bcrypt.hash(defaultPassword, BCRYPT_ROUNDS);

    const adminUser = await prisma.user.create({
      data: {
        email: "admin@example.com",
        passwordHash,
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        isActive: true,
        organizationId: defaultOrg.id,
      },
    });
    console.log(`✅ Created admin user: ${adminUser.email}\n`);

    console.log("🎉 Migration completed successfully!\n");
    console.log("=".repeat(60));
    console.log("⚠️  IMPORTANT: Default admin credentials:");
    console.log(`   Email:    ${adminUser.email}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log("=".repeat(60));
    console.log(
      "\n⚠️  Please change this password immediately after first login!\n",
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToMultiTenancy().catch((error) => {
  console.error(error);
  process.exit(1);
});
