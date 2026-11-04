-- CreateEnum
CREATE TYPE "prospect_status" AS ENUM ('received', 'contacted', 'enrolled', 'closed');

-- CreateTable
CREATE TABLE "prospects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "interest" TEXT,
    "message" TEXT,
    "status" "prospect_status" NOT NULL DEFAULT 'received',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prospects_status_created_at_idx" ON "prospects"("status", "created_at");

ALTER TABLE "prospects" ENABLE ROW LEVEL SECURITY;