// Fills the database with fake students, instructors, cars and lessons, so the admin
// screens have something to show.
// Run with:  npm run db:seed
//
// Safe to run again: it first removes the demo records it created earlier and creates them
// anew. Real students, instructors, cars and lessons are never touched. A demo student,
// instructor or car that a real lesson refers to is kept, so no lesson is lost.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import {
    SEED_CAR_MARK,
    SEED_INSTRUCTOR_DOMAIN,
    SEED_LESSON_MARK,
    SEED_PREFIX,
    buildSeedCars,
    buildSeedInstructors,
    buildSeedLessons,
    buildSeedStudents,
} from "./seed-data";
import { site } from "../lib/site";

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    }

    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaClient({ adapter });

    try {
        // Demo lessons go first, because they refer to the demo students, instructors and cars.
        const removedLessons = await prisma.lesson.deleteMany({ where: { notes: { startsWith: SEED_LESSON_MARK } } });
        console.log(`Removed ${removedLessons.count} earlier demo lessons.`);

        // A demo student with a real lesson is kept, so no lesson is lost.
        const removed = await prisma.student.deleteMany({
            where: { nationalId: { startsWith: SEED_PREFIX }, lessons: { none: {} } },
        });

        const students = buildSeedStudents();
        const created = await prisma.student.createMany({ data: students });

        const counts: Record<string, number> = {};
        for (const student of students) {
            counts[student.status] = (counts[student.status] ?? 0) + 1;
        }

        console.log(`Removed ${removed.count} earlier seed students.`);
        console.log(`Created ${created.count} students:`, counts);

        const removedInstructors = await prisma.instructor.deleteMany({
            where: { email: { endsWith: SEED_INSTRUCTOR_DOMAIN }, lessons: { none: {} } },
        });
        const instructors = await prisma.instructor.createMany({ data: buildSeedInstructors(), skipDuplicates: true });
        console.log(`Instructors: removed ${removedInstructors.count}, created ${instructors.count}.`);

        const removedCars = await prisma.car.deleteMany({
            where: { notes: { startsWith: SEED_CAR_MARK }, lessons: { none: {} } },
        });
        // skipDuplicates: a car with the same plate already exists, so it is left alone.
        const cars = await prisma.car.createMany({ data: buildSeedCars(), skipDuplicates: true });
        console.log(`Cars: removed ${removedCars.count}, created ${cars.count}.`);

        const lessons = buildSeedLessons({
            students: await prisma.student.findMany({
                where: { nationalId: { startsWith: SEED_PREFIX } },
                orderBy: { nationalId: "asc" },
                select: { id: true, status: true },
            }),
            instructors: await prisma.instructor.findMany({
                where: { email: { endsWith: SEED_INSTRUCTOR_DOMAIN }, active: true },
                orderBy: { email: "asc" },
                select: { id: true },
            }),
            cars: await prisma.car.findMany({
                where: { notes: { startsWith: SEED_CAR_MARK }, active: true },
                orderBy: { plate: "asc" },
                select: { id: true },
            }),
            now: new Date(),
            timeZone: site.timeZone,
        });

        // One by one: if you already planned a real lesson at the same time, that demo lesson
        // is skipped instead of stopping the whole seed.
        let planned = 0;
        let skipped = 0;
        for (const lesson of lessons) {
            try {
                await prisma.lesson.create({ data: lesson });
                planned++;
            } catch {
                skipped++;
            }
        }
        console.log(`Lessons: created ${planned}${skipped ? `, skipped ${skipped} that overlap a real lesson` : ""}.`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
