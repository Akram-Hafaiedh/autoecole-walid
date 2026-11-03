-- CreateEnum
CREATE TYPE "price_mode" AS ENUM ('per_session', 'per_hour');

-- CreateEnum
CREATE TYPE "charge_source" AS ENUM ('standard', 'student', 'custom', 'package', 'absence');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'transfer', 'cheque', 'other');

-- CreateEnum
CREATE TYPE "discount_kind" AS ENUM ('percent', 'fixed');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "amount" INTEGER,
ADD COLUMN     "charge_source" "charge_source",
ADD COLUMN     "custom_price" INTEGER,
ADD COLUMN     "custom_price_mode" "price_mode";

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "package_total" INTEGER;

-- CreateTable
CREATE TABLE "rates" (
    "kind" "lesson_kind" NOT NULL,
    "mode" "price_mode" NOT NULL,
    "amount" INTEGER NOT NULL,
    "absence_fee" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rates_pkey" PRIMARY KEY ("kind")
);

-- CreateTable
CREATE TABLE "student_rates" (
    "student_id" UUID NOT NULL,
    "kind" "lesson_kind" NOT NULL,
    "mode" "price_mode" NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "student_rates_pkey" PRIMARY KEY ("student_id","kind")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "kind" "discount_kind" NOT NULL,
    "value" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" DATE,
    "valid_to" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_discounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "discount_id" UUID,
    "label" TEXT NOT NULL,
    "kind" "discount_kind" NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voided_at" TIMESTAMPTZ(6),

    CONSTRAINT "student_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "paid_on" DATE NOT NULL,
    "method" "payment_method" NOT NULL DEFAULT 'cash',
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voided_at" TIMESTAMPTZ(6),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_discounts_student_id_idx" ON "student_discounts"("student_id");

-- CreateIndex
CREATE INDEX "payments_student_id_paid_on_idx" ON "payments"("student_id", "paid_on");

-- AddForeignKey
ALTER TABLE "student_rates" ADD CONSTRAINT "student_rates_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_discounts" ADD CONSTRAINT "student_discounts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_discounts" ADD CONSTRAINT "student_discounts_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
