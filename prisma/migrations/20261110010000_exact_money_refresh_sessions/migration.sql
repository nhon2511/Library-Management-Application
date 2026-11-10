-- Refuse lossy or out-of-range conversion of existing money values.
-- These columns were introduced after the pre-migration production schema.
ALTER TABLE "users" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "borrow_records" ADD COLUMN "reminder_sent_at" TIMESTAMP(3);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "books"
        WHERE "price" <> trunc("price") OR "price" < 0 OR "price" > 1000000000
    ) OR EXISTS (
        SELECT 1 FROM "fines"
        WHERE "amount" <> trunc("amount") OR "amount" < 0 OR "amount" > 2000000000
           OR "paid_amount" <> trunc("paid_amount") OR "paid_amount" < 0
           OR "paid_amount" > "amount"
    ) THEN
        RAISE EXCEPTION 'Money migration requires integer VND values within supported bounds';
    END IF;
END $$;

-- AlterTable
ALTER TABLE "books" ALTER COLUMN "price" SET DEFAULT 0,
ALTER COLUMN "price" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "fines" ALTER COLUMN "amount" SET DATA TYPE INTEGER,
ALTER COLUMN "paid_amount" SET DEFAULT 0,
ALTER COLUMN "paid_amount" SET DATA TYPE INTEGER;

ALTER TABLE "books" ADD CONSTRAINT "books_price_range" CHECK ("price" BETWEEN 0 AND 1000000000);
ALTER TABLE "fines" ADD CONSTRAINT "fines_amount_range" CHECK ("amount" BETWEEN 0 AND 2000000000 AND "paid_amount" BETWEEN 0 AND "amount");

-- CreateTable
CREATE TABLE "refresh_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_token_hash_key" ON "refresh_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_sessions_user_id_revoked_at_idx" ON "refresh_sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "refresh_sessions_expires_at_idx" ON "refresh_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
