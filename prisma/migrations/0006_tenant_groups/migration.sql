CREATE TABLE "tenant_groups" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "tenant_group_owners" (
  "group_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("group_id", "user_id"),
  CONSTRAINT "tenant_group_owners_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tenant_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tenant_group_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "tenant_group_owners_user_id_key" ON "tenant_group_owners"("user_id");

ALTER TABLE "tenants" ADD COLUMN "group_id" TEXT REFERENCES "tenant_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "tenants_group_id_idx" ON "tenants"("group_id");
