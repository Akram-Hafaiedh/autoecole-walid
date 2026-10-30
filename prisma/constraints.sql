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
ALTER TABLE "login_codes" ENABLE ROW LEVEL SECURITY;
