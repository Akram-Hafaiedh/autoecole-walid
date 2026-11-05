import type { Metadata } from "next";
import { createLesson } from "@/actions/lessons";
import { PageHeader } from "@/components/admin/PageHeader";
import { LessonForm } from "@/components/planning/LessonForm";
import { requireAdmin } from "@/lib/auth";
import { isUuid } from "@/lib/format";
import { planningHref } from "@/lib/planning";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { isDateString, utcToZoned } from "@/lib/time";

export const metadata: Metadata = { title: "Nouvelle leçon" };

type SearchParams = Promise<{ date?: string; moniteur?: string; vehicule?: string }>;

export default async function NewLessonPage({ searchParams }: { searchParams: SearchParams }) {
    await requireAdmin();

    const params = await searchParams;
    const date = params.date && isDateString(params.date) ? params.date : utcToZoned(new Date(), site.timeZone).date;

    const [students, instructors, cars] = await Promise.all([
        prisma.student.findMany({
            where: { status: { not: "archived" } },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            select: { id: true, firstName: true, lastName: true },
        }),
        prisma.instructor.findMany({
            where: { active: true },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            select: { id: true, firstName: true, lastName: true },
        }),
        prisma.car.findMany({ where: { active: true }, orderBy: { label: "asc" }, select: { id: true, label: true } }),
    ]);

    return (
        <>
            <PageHeader
                title="Nouvelle leçon"
                description="Choisissez l’élève, le moniteur et le créneau. Toute durée est possible, de 15 minutes à 12 heures."
                back={{ href: planningHref({ semaine: date }), label: "Planning" }}
            />
            <LessonForm
                action={createLesson}
                submitLabel="Planifier la leçon"
                cancelHref={planningHref({ semaine: date })}
                students={students.map((s) => ({ id: s.id, label: `${s.lastName} ${s.firstName}` }))}
                instructors={instructors.map((i) => ({ id: i.id, label: `${i.firstName} ${i.lastName}` }))}
                cars={cars.map((c) => ({ id: c.id, label: c.label }))}
                initial={{
                    studentId: "",
                    instructorId: params.moniteur && isUuid(params.moniteur) ? params.moniteur : "",
                    carId: params.vehicule && isUuid(params.vehicule) ? params.vehicule : "",
                    kind: "driving",
                    status: "scheduled",
                    date,
                    time: "08:00",
                    duration: "120",
                    priceMode: "",
                    price: "",
                    notes: "",
                    repeat: "once",
                    count: "8",
                }}
            />
        </>
    );
}
