import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:local.db";

export default defineConfig(
  url.startsWith("file:")
    ? {
        dialect: "sqlite",
        schema: "./lib/db/schema.ts",
        out: "./drizzle",
        dbCredentials: { url },
      }
    : {
        dialect: "turso",
        schema: "./lib/db/schema.ts",
        out: "./drizzle",
        dbCredentials: { url, authToken: process.env.DATABASE_AUTH_TOKEN },
      },
);
