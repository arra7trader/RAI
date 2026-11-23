ALTER TABLE "products" ADD COLUMN "track_inventory" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "stock_quantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "low_stock_threshold" INTEGER NOT NULL DEFAULT 5;

CREATE TABLE "suppliers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL DEFAULT '',
  "notes" TEXT NOT NULL DEFAULT '',
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "suppliers_tenant_id_name_key" ON "suppliers"("tenant_id", "name");
CREATE INDEX "suppliers_tenant_id_name_idx" ON "suppliers"("tenant_id", "name");

CREATE TABLE "purchases" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "supplier_id" TEXT,
  "reference" TEXT NOT NULL DEFAULT '',
  "total" INTEGER NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "purchases_tenant_id_created_at_idx" ON "purchases"("tenant_id", "created_at");

CREATE TABLE "purchase_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "purchase_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_cost" INTEGER NOT NULL,
  "line_total" INTEGER NOT NULL,
  CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "purchase_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "purchase_items_purchase_id_idx" ON "purchase_items"("purchase_id");

CREATE TABLE "stock_movements" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "order_id" TEXT,
  "purchase_id" TEXT,
  "type" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "stock_movements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "stock_movements_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "stock_movements_tenant_id_created_at_idx" ON "stock_movements"("tenant_id", "created_at");
CREATE INDEX "stock_movements_product_id_created_at_idx" ON "stock_movements"("product_id", "created_at");
CREATE INDEX "stock_movements_order_id_idx" ON "stock_movements"("order_id");
CREATE INDEX "stock_movements_purchase_id_idx" ON "stock_movements"("purchase_id");
