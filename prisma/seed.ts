// Fills the database with fake students so the admin screens have something to show.
// Run with:  npm run db:seed
//
// Safe to run again: it first removes the demo records it created earlier and creates them
// anew. Real students, instructors and cars are never touched. A demo instructor or car that
// already has lessons is kept, so no lesson is lost.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import {
    SEED_CAR_MARK,
    SEED_INSTRUCTOR_DOMAIN,
    SEED_PREFIX,
    buildSeedCars,
    buildSeedInstructors,
    buildSeedStudents,
} from "./seed-data";

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    }

    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaClient({ adapter });

    try {
        const removed = await prisma.student.deleteMany({
            where: { nationalId: { startsWith: SEED_PREFIX } },
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
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
