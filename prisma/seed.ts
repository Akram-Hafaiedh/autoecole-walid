// Fills the database with fake students so the admin screens have something to show.
// Run with:  npm run db:seed
//
// Safe to run again: it first removes the students it created earlier (national ID
// starting with "SEED-") and creates them anew. Real students are never touched.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { SEED_PREFIX, buildSeedStudents } from "./seed-data";

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
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
