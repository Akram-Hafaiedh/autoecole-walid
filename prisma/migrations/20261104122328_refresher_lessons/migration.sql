-- AlterEnum
ALTER TYPE "lesson_kind" ADD VALUE 'refresher';
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_driving_needs_car";
ALTER TABLE "lessons" ADD CONSTRAINT lessons_driving_needs_car CHECK (kind::text NOT IN ('driving', 'refresher') OR car_id IS NOT NULL);