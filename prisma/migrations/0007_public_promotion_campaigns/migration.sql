CREATE TABLE "promotion_campaigns" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "discount_type" TEXT NOT NULL,
  "discount_value" INTEGER NOT NULL,
  "minimum_purchase" INTEGER NOT NULL DEFAULT 0,
  "quota" INTEGER NOT NULL,
  "claimed_count" INTEGER NOT NULL DEFAULT 0,
  "valid_until" DATETIME NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "free_product_id" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "promotion_campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "promotion_campaigns_free_product_id_fkey" FOREIGN KEY ("free_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "promotion_campaigns_tenant_id_is_active_valid_until_idx"
  ON "promotion_campaigns"("tenant_id", "is_active", "valid_until");

ALTER TABLE "vouchers" ADD COLUMN "promotion_id" TEXT REFERENCES "promotion_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vouchers" ADD COLUMN "free_product_id" TEXT REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vouchers" ADD COLUMN "discount_type" TEXT NOT NULL DEFAULT 'NOMINAL';
ALTER TABLE "vouchers" ADD COLUMN "discount_value" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "vouchers" ADD COLUMN "minimum_purchase" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "vouchers_promotion_id_customer_id_key"
  ON "vouchers"("promotion_id", "customer_id");
