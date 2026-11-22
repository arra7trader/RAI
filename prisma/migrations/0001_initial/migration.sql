-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "phone_wa" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "latitude" REAL,
    "longitude" REAL,
    "geofence_radius" INTEGER NOT NULL DEFAULT 50,
    "google_review_url" TEXT NOT NULL DEFAULT '',
    "instagram_url" TEXT,
    "tiktok_url" TEXT,
    "logo_url" TEXT,
    "active_qr_mode" TEXT NOT NULL DEFAULT 'DEFAULT_HUB',
    "daily_staff_pin_hash" TEXT,
    "work_start_time" TEXT NOT NULL DEFAULT '09:00',
    "plan_tier" TEXT NOT NULL DEFAULT 'LARIS',
    "plan_status" TEXT NOT NULL DEFAULT 'TRIAL',
    "managed_by_rai" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "qr_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "tenant_id" TEXT,
    "label" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'UNASSIGNED',
    "total_scans" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qr_codes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "visitor_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "visitor_token" TEXT NOT NULL,
    "first_seen_at" DATETIME NOT NULL,
    "last_seen_at" DATETIME NOT NULL,
    "visit_count" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "visitor_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "store_visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "qr_code_id" TEXT NOT NULL,
    "visitor_token" TEXT NOT NULL,
    "visitor_type" TEXT NOT NULL,
    "visited_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_visits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "store_visits_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "qr_codes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Umum',
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" INTEGER NOT NULL,
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_role_idx" ON "users"("tenant_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_code_key" ON "qr_codes"("code");

-- CreateIndex
CREATE INDEX "qr_codes_tenant_id_status_idx" ON "qr_codes"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_sessions_tenant_id_visitor_token_key" ON "visitor_sessions"("tenant_id", "visitor_token");

-- CreateIndex
CREATE INDEX "store_visits_tenant_id_visited_at_idx" ON "store_visits"("tenant_id", "visited_at");

-- CreateIndex
CREATE INDEX "store_visits_tenant_id_visitor_type_visited_at_idx" ON "store_visits"("tenant_id", "visitor_type", "visited_at");

-- CreateIndex
CREATE INDEX "store_visits_qr_code_id_visited_at_idx" ON "store_visits"("qr_code_id", "visited_at");

-- CreateIndex
CREATE INDEX "products_tenant_id_is_available_category_idx" ON "products"("tenant_id", "is_available", "category");
