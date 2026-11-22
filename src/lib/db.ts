import "server-only";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaUrl?: string;
};

export function getDb() {
  const databaseUrl =
    process.env.TURSO_DATABASE_URL ||
    process.env.DATABASE_URL ||
    (process.env.NODE_ENV === "production" ? "" : "file:./dev.db");

  if (!databaseUrl) {
    throw new Error("TURSO_DATABASE_URL must be configured in production.");
  }

  const isRemoteDatabase = /^(libsql|https):\/\//i.test(databaseUrl);
  if (process.env.NODE_ENV === "production" && !isRemoteDatabase) {
    throw new Error("Production must use a remote Turso database URL.");
  }
  if (process.env.NODE_ENV === "production" && !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_AUTH_TOKEN must be configured in production.");
  }

  if (globalForPrisma.prisma && globalForPrisma.prismaUrl !== databaseUrl) {
    void globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }

  const client =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter: new PrismaLibSql({
        url: databaseUrl,
        authToken: process.env.TURSO_AUTH_TOKEN || undefined,
      }),
    });

  globalForPrisma.prisma = client;
  globalForPrisma.prismaUrl = databaseUrl;

  return client;
}
