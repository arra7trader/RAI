import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";

if (!url.startsWith("file:")) {
  throw new Error("Demo seed only runs against a local file database.");
}

const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url }) });

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "kopi-senja" },
    update: {},
    create: {
      name: "Kopi Senja",
      slug: "kopi-senja",
      category: "FNB",
      address: "Jakarta",
      planTier: "LARIS",
      planStatus: "TRIAL",
    },
  });

  await prisma.qrCode.upsert({
    where: { code: "RAI-DEMO" },
    update: { tenantId: tenant.id, status: "ACTIVE", label: "QR Demo Kopi Senja" },
    create: {
      code: "RAI-DEMO",
      tenantId: tenant.id,
      status: "ACTIVE",
      label: "QR Demo Kopi Senja",
    },
  });

  await prisma.product.upsert({
    where: { id: "rai-demo-es-kopi-susu" },
    update: { tenantId: tenant.id, isAvailable: true },
    create: {
      id: "rai-demo-es-kopi-susu",
      tenantId: tenant.id,
      category: "Minuman",
      name: "Es Kopi Susu",
      description: "Kopi susu gula aren buatan barista.",
      price: 18000,
    },
  });

  console.log("Demo store ready: /q/RAI-DEMO → /kopi-senja");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
