import path from "node:path";
import { defineConfig } from "prisma/config";
import "dotenv/config"; // Loads .env file contents into process.env and is used by index.prisma

export default defineConfig({
  schema: path.join("prisma/schema"),
  migrations: {
    path: path.join("prisma/migrations"),
  },
});
