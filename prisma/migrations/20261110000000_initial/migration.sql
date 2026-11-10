-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('READER', 'LIBRARIAN', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BookCopyStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'BORROWED', 'DAMAGED', 'LOST');

-- CreateEnum
CREATE TYPE "BorrowStatus" AS ENUM ('RESERVED', 'BORROWED', 'RETURNED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "BorrowItemStatus" AS ENUM ('BORROWED', 'RETURNED', 'LOST', 'DAMAGED');

-- CreateEnum
CREATE TYPE "FineType" AS ENUM ('OVERDUE', 'DAMAGE', 'LOSS');

-- CreateEnum
CREATE TYPE "FineStatus" AS ENUM ('UNPAID', 'PAID', 'WAIVED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'READER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatar_url" TEXT,
    "qr_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "publisher" TEXT,
    "published_year" INTEGER,
    "description" TEXT,
    "cover_image_url" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_copies" INTEGER NOT NULL DEFAULT 0,
    "available_copies" INTEGER NOT NULL DEFAULT 0,
    "category_id" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_copies" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "shelf_location" TEXT,
    "status" "BookCopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrow_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "librarian_id" TEXT,
    "status" "BorrowStatus" NOT NULL DEFAULT 'RESERVED',
    "borrow_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "return_date" TIMESTAMP(3),
    "renew_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrow_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrow_items" (
    "id" TEXT NOT NULL,
    "borrow_record_id" TEXT NOT NULL,
    "book_copy_id" TEXT NOT NULL,
    "status" "BorrowItemStatus" NOT NULL DEFAULT 'BORROWED',
    "return_date" TIMESTAMP(3),
    "return_condition" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrow_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "borrow_record_id" TEXT,
    "type" "FineType" NOT NULL,
    "status" "FineStatus" NOT NULL DEFAULT 'UNPAID',
    "amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "paid_at" TIMESTAMP(3),
    "payment_method" TEXT,
    "waived_by" TEXT,
    "waived_reason" TEXT,
    "waived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "data_type" TEXT NOT NULL DEFAULT 'string',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_qr_code_key" ON "users"("qr_code");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "books"("isbn");

-- CreateIndex
CREATE INDEX "books_title_idx" ON "books"("title");

-- CreateIndex
CREATE INDEX "books_author_idx" ON "books"("author");

-- CreateIndex
CREATE INDEX "books_isbn_idx" ON "books"("isbn");

-- CreateIndex
CREATE INDEX "books_category_id_idx" ON "books"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_copies_barcode_key" ON "book_copies"("barcode");

-- CreateIndex
CREATE INDEX "book_copies_barcode_idx" ON "book_copies"("barcode");

-- CreateIndex
CREATE INDEX "book_copies_book_id_idx" ON "book_copies"("book_id");

-- CreateIndex
CREATE INDEX "book_copies_status_idx" ON "book_copies"("status");

-- CreateIndex
CREATE INDEX "borrow_records_user_id_idx" ON "borrow_records"("user_id");

-- CreateIndex
CREATE INDEX "borrow_records_librarian_id_idx" ON "borrow_records"("librarian_id");

-- CreateIndex
CREATE INDEX "borrow_records_status_idx" ON "borrow_records"("status");

-- CreateIndex
CREATE INDEX "borrow_records_due_date_idx" ON "borrow_records"("due_date");

-- CreateIndex
CREATE INDEX "borrow_items_borrow_record_id_idx" ON "borrow_items"("borrow_record_id");

-- CreateIndex
CREATE INDEX "borrow_items_book_copy_id_idx" ON "borrow_items"("book_copy_id");

-- CreateIndex
CREATE UNIQUE INDEX "borrow_items_borrow_record_id_book_copy_id_key" ON "borrow_items"("borrow_record_id", "book_copy_id");

-- CreateIndex
CREATE INDEX "fines_user_id_idx" ON "fines"("user_id");

-- CreateIndex
CREATE INDEX "fines_borrow_record_id_idx" ON "fines"("borrow_record_id");

-- CreateIndex
CREATE INDEX "fines_status_idx" ON "fines"("status");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_records" ADD CONSTRAINT "borrow_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_records" ADD CONSTRAINT "borrow_records_librarian_id_fkey" FOREIGN KEY ("librarian_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_items" ADD CONSTRAINT "borrow_items_borrow_record_id_fkey" FOREIGN KEY ("borrow_record_id") REFERENCES "borrow_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_items" ADD CONSTRAINT "borrow_items_book_copy_id_fkey" FOREIGN KEY ("book_copy_id") REFERENCES "book_copies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fines" ADD CONSTRAINT "fines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fines" ADD CONSTRAINT "fines_borrow_record_id_fkey" FOREIGN KEY ("borrow_record_id") REFERENCES "borrow_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
