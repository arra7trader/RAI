CREATE TABLE "admin_login_attempts" (
    "email_hash" TEXT NOT NULL PRIMARY KEY,
    "window_start_at" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0
);
