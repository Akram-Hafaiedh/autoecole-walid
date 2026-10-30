-- CreateEnum
CREATE TYPE "student_status" AS ENUM ('active', 'paused', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "lesson_kind" AS ENUM ('driving', 'code', 'exam');

-- CreateEnum
CREATE TYPE "lesson_status" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "transmission" AS ENUM ('manual', 'automatic');

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "birth_date" DATE,
    "national_id" TEXT,
    "licence_category" TEXT NOT NULL DEFAULT 'B',
    "status" "student_status" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "auth_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cars" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "transmission" "transmission" NOT NULL DEFAULT 'manual',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "next_service_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "instructor_id" UUID NOT NULL,
    "car_id" UUID,
    "kind" "lesson_kind" NOT NULL DEFAULT 'driving',
    "status" "lesson_status" NOT NULL DEFAULT 'scheduled',
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instructors_auth_user_id_key" ON "instructors"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cars_plate_key" ON "cars"("plate");

-- CreateIndex
CREATE INDEX "lessons_starts_at_idx" ON "lessons"("starts_at");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rules Prisma cannot express. Append this whole file to the end of the first
-- migration (prisma/migrations/<timestamp>_init/migration.sql) before applying it.
-- See README, section "Database".

-- Lets a gist index compare plain values (instructor, car, student) with "=".
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- A lesson must end after it starts.
ALTER TABLE "lessons"
  ADD CONSTRAINT lessons_ends_after_start CHECK (ends_at > starts_at);

-- A driving lesson needs a car. Code and exam lessons do not.
ALTER TABLE "lessons"
  ADD CONSTRAINT lessons_driving_needs_car CHECK (kind <> 'driving' OR car_id IS NOT NULL);

-- No overlapping lessons for the same instructor, the same car or the same student.
-- Cancelled lessons free their slot. Back-to-back lessons are allowed.
-- A null car_id never conflicts with another null.
ALTER TABLE "lessons"
  ADD CONSTRAINT lessons_no_instructor_overlap EXCLUDE USING gist (
    instructor_id WITH =, tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status <> 'cancelled');

ALTER TABLE "lessons"
  ADD CONSTRAINT lessons_no_car_overlap EXCLUDE USING gist (
    car_id WITH =, tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status <> 'cancelled');

ALTER TABLE "lessons"
  ADD CONSTRAINT lessons_no_student_overlap EXCLUDE USING gist (
    student_id WITH =, tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status <> 'cancelled');

-- Nobody can read these tables with a public (anon) key. The app reads and writes
-- through the server, after checking that the visitor is logged in.
ALTER TABLE "students"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "instructors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cars"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lessons"     ENABLE ROW LEVEL SECURITY;
