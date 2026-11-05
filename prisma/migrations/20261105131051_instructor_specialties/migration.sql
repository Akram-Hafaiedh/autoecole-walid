-- AlterTable
ALTER TABLE "instructors" ADD COLUMN     "teaches_code" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "teaches_driving" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "instructors" ADD CONSTRAINT instructors_teaches_something CHECK (teaches_code OR teaches_driving);