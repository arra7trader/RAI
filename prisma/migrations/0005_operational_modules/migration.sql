-- CreateTable
CREATE TABLE "store_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "business_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "owner_name" TEXT NOT NULL,
    "owner_email" TEXT NOT NULL,
    "phone_wa" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "maps_url" TEXT NOT NULL DEFAULT '',
    "google_review_url" TEXT NOT NULL DEFAULT '',
    "plan_tier" TEXT NOT NULL DEFAULT 'LARIS',
    "staff_name" TEXT NOT NULL DEFAULT '',
    "staff_email" TEXT NOT NULL DEFAULT '',
    "data_consent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "review_note" TEXT NOT NULL DEFAULT '',
    "tenant_id" TEXT,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" DATETIME
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone_wa" TEXT NOT NULL,
    "card_token" TEXT NOT NULL,
    "stamp_balance" INTEGER NOT NULL DEFAULT 0,
    "stamps_issued" INTEGER NOT NULL DEFAULT 0,
    "stamps_redeemed" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stamp_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "order_id" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stamp_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stamp_events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stamp_events_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stamp_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "expires_at" DATETIME,
    "redeemed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vouchers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vouchers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customer_feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "rating" INTEGER NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" DATETIME,
    CONSTRAINT "customer_feedback_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "customer_feedback_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "review_clicks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "clicked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_clicks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "queue_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "day_key" TEXT NOT NULL,
    "ticket_number" INTEGER NOT NULL,
    "customer_name" TEXT NOT NULL DEFAULT '',
    "phone_wa" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "called_at" DATETIME,
    CONSTRAINT "queue_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "queue_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "customer_id" TEXT,
    "voucher_id" TEXT,
    "payment_method" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orders_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "orders_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total" INTEGER NOT NULL,
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cash_drawer_shifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "opened_by_id" TEXT NOT NULL,
    "closed_by_id" TEXT,
    "opening_cash" INTEGER NOT NULL,
    "counted_cash" INTEGER,
    "expected_cash" INTEGER,
    "opened_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" DATETIME,
    CONSTRAINT "cash_drawer_shifts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cash_drawer_shifts_opened_by_id_fkey" FOREIGN KEY ("opened_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cash_drawer_shifts_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Add the optional shift relation after its target table exists.
ALTER TABLE "orders" ADD COLUMN "shift_id" TEXT REFERENCES "cash_drawer_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "cash_drawer_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cash_drawer_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cash_drawer_movements_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "cash_drawer_shifts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day_key" TEXT NOT NULL,
    "check_in_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "check_out_at" DATETIME,
    "check_in_latitude" REAL NOT NULL,
    "check_in_longitude" REAL NOT NULL,
    "check_in_distance" INTEGER NOT NULL,
    "check_in_selfie_at" DATETIME NOT NULL,
    "check_in_selfie_data" TEXT NOT NULL DEFAULT '',
    "check_out_latitude" REAL,
    "check_out_longitude" REAL,
    "check_out_distance" INTEGER,
    "check_out_selfie_at" DATETIME,
    "check_out_selfie_data" TEXT,
    CONSTRAINT "attendances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- SQLite supports adding a non-null column with a constant default without rebuilding the table.
ALTER TABLE "loyalty_programs" ADD COLUMN "reward_discount" INTEGER NOT NULL DEFAULT 0;

-- The counter row serializes queue-number allocation per store and Jakarta date.
CREATE TABLE "queue_counters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "next_value" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE INDEX "store_applications_status_submitted_at_idx" ON "store_applications"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "store_applications_owner_email_submitted_at_idx" ON "store_applications"("owner_email", "submitted_at");

-- CreateIndex
CREATE INDEX "customers_tenant_id_created_at_idx" ON "customers"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_phone_wa_key" ON "customers"("tenant_id", "phone_wa");
CREATE UNIQUE INDEX "customers_card_token_key" ON "customers"("card_token");

-- CreateIndex
CREATE INDEX "stamp_events_tenant_id_customer_id_created_at_idx" ON "stamp_events"("tenant_id", "customer_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "vouchers_tenant_id_status_expires_at_idx" ON "vouchers"("tenant_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "customer_feedback_tenant_id_status_created_at_idx" ON "customer_feedback"("tenant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "review_clicks_tenant_id_clicked_at_idx" ON "review_clicks"("tenant_id", "clicked_at");

-- CreateIndex
CREATE INDEX "queue_tickets_tenant_id_day_key_status_ticket_number_idx" ON "queue_tickets"("tenant_id", "day_key", "status", "ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "queue_tickets_tenant_id_day_key_ticket_number_key" ON "queue_tickets"("tenant_id", "day_key", "ticket_number");

-- CreateIndex
CREATE INDEX "orders_tenant_id_created_at_idx" ON "orders"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_tenant_id_status_created_at_idx" ON "orders"("tenant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "orders_tenant_id_shift_id_idx" ON "orders"("tenant_id", "shift_id");

-- CreateIndex
CREATE INDEX "cash_drawer_shifts_tenant_id_opened_at_idx" ON "cash_drawer_shifts"("tenant_id", "opened_at");

-- CreateIndex
CREATE INDEX "cash_drawer_shifts_tenant_id_closed_at_idx" ON "cash_drawer_shifts"("tenant_id", "closed_at");
CREATE UNIQUE INDEX "cash_drawer_one_open_per_tenant" ON "cash_drawer_shifts"("tenant_id") WHERE "closed_at" IS NULL;

-- CreateIndex
CREATE INDEX "cash_drawer_movements_tenant_id_created_at_idx" ON "cash_drawer_movements"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "cash_drawer_movements_shift_id_created_at_idx" ON "cash_drawer_movements"("shift_id", "created_at");

-- CreateIndex
CREATE INDEX "attendances_tenant_id_day_key_check_in_at_idx" ON "attendances"("tenant_id", "day_key", "check_in_at");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_tenant_id_user_id_day_key_key" ON "attendances"("tenant_id", "user_id", "day_key");
