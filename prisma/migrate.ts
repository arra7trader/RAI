import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

if (!url.startsWith("file:") && !authToken) {
  throw new Error("TURSO_AUTH_TOKEN is required for a remote database.");
}

const migrationDirectory = join(process.cwd(), "prisma", "migrations");
const client = createClient({ url, authToken });

async function main() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_rai_migrations" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "applied_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { rows } = await client.execute(
    "SELECT name FROM _rai_migrations ORDER BY name ASC",
  );
  const appliedNames = new Set(rows.map((row) => String(row.name)));
  const migrationNames = (await readdir(migrationDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const name of migrationNames) {
    if (appliedNames.has(name)) continue;

    const sql = await readFile(join(migrationDirectory, name, "migration.sql"), "utf8");
    const transaction = await client.transaction("write");

    try {
      await transaction.executeMultiple(sql);
      await transaction.execute({
        sql: "INSERT INTO _rai_migrations (name) VALUES (?)",
        args: [name],
      });
      await transaction.commit();
      console.log(`Applied ${name}`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      transaction.close();
    }
  }

  if (migrationNames.every((name) => appliedNames.has(name))) {
    console.log("Database already up to date.");
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
