import { PrismaClient } from "@prisma/client";

const DIRECT_POSTGRES_URL =
  "postgresql://postgres:FeFv%3F-%40beFc7qWP@db.gqqzcznxncatfovulmtp.supabase.co:5432/postgres";

const activeUrl =
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes("aws-0-us-east-1") &&
  !process.env.DATABASE_URL.includes("aws-0-ap-southeast-1")
    ? process.env.DATABASE_URL
    : DIRECT_POSTGRES_URL;

process.env.DATABASE_URL = activeUrl;
process.env.DIRECT_URL = activeUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: activeUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
