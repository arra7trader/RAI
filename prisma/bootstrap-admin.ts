import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const name = process.env.RAI_SUPER_ADMIN_NAME?.trim();
const email = process.env.RAI_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.RAI_SUPER_ADMIN_PASSWORD;

if (!url) throw new Error("Set TURSO_DATABASE_URL or DATABASE_URL before bootstrapping admin.");
if (!name || !email || !password || password.length < 16) {
  throw new Error("Set RAI_SUPER_ADMIN_NAME, RAI_SUPER_ADMIN_EMAIL, and a password of at least 16 characters.");
}

const adminName = name;
const adminEmail = email;
const adminPassword = password;

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  }),
});

async function main() {
  const existingAdmins = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
  if (existingAdmins > 0) {
    throw new Error("A SUPER_ADMIN already exists. Bootstrap is restricted to the first admin.");
  }

  const passwordHash = await hash(adminPassword, 12);
  await prisma.user.create({
    data: { name: adminName, email: adminEmail, passwordHash, role: "SUPER_ADMIN" },
  });
  console.log(`Created first SUPER_ADMIN: ${adminEmail}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Admin bootstrap failed.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
