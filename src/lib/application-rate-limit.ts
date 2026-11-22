import "server-only";
import { createHmac } from "node:crypto";
import { getAuthSecret } from "@/lib/auth-secret";
import { getDb } from "@/lib/db";

export async function consumeApplicationAttempt(address: string) {
  const emailHash = createHmac("sha256", getAuthSecret()).update(`application:${address}`).digest("hex");
  const now = new Date();
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000);
  const db = getDb();
  const rows = await db.$queryRaw<Array<{ attempts: number }>>`
    INSERT INTO "admin_login_attempts" ("email_hash", "window_start_at", "attempts")
    VALUES (${emailHash}, ${now.toISOString()}, 1)
    ON CONFLICT("email_hash") DO UPDATE SET
      "attempts" = CASE WHEN julianday("admin_login_attempts"."window_start_at") <= julianday(${cutoff.toISOString()}) THEN 1 ELSE "admin_login_attempts"."attempts" + 1 END,
      "window_start_at" = CASE WHEN julianday("admin_login_attempts"."window_start_at") <= julianday(${cutoff.toISOString()}) THEN excluded."window_start_at" ELSE "admin_login_attempts"."window_start_at" END
    RETURNING "attempts"
  `;
  return rows[0]?.attempts ?? 99;
}
