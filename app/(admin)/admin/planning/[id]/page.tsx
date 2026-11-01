import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateLesson } from "@/actions/lessons";
import { PageHeader } from "@/components/admin/PageHeader";
import { LessonForm } from "@/components/planning/LessonForm";
import { kindStyles } from "@/components/planning/lessonStyles";
import { requireAdmin } from "@/lib/auth";
import { isUuid } from "@/lib/format";
import { KIND_LABELS, LESSON_STATUS_LABELS, type LessonKindValue, type LessonStatusValue } from "@/lib/lessons";
import { planningHref } from "@/lib/planning";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { durationLabel, formatDayLong, formatRange, formatTime, utcToZoned } from "@/lib/time";

export const metadata: Metadata = { title: "Leçon" };

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();

    const { id } = await params;
    if (!isUuid(id)) notFound();

    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) notFound();

    const [students, instructors, cars] = await Promise.all([
        prisma.student.findMany({
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            select: { id: true, firstName: true, lastName: true, status: true },
        }),
        prisma.instructor.findMany({
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            select: { id: true, firstName: true, lastName: true, active: true },
        }),
        prisma.car.findMany({ orderBy: { label: "asc" }, select: { id: true, label: true, active: true } }),
    ]);

    const begin = utcToZoned(lesson.startsAt, site.timeZone);
    const length = Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60_000);
    const kind = lesson.kind as LessonKindValue;
    const status = lesson.status as LessonStatusValue;

    // Archived students and inactive instructors or cars are not offered for new lessons,
    // but stay in the list when this lesson already uses them.
    return (
        <>
            <PageHeader
                back={{ href: planningHref({ semaine: begin.date }), label: "Planning" }}
                title={`${KIND_LABELS[kind]} · ${formatDayLong(begin.date)}`}
                description={
                    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-2">
                            <span aria-hidden="true" className={`size-2.5 rounded-full ${kindStyles[kind].dot}`} />
                            <span className="tabular-nums">{formatRange(begin.minutes, begin.minutes + length)}</span>
                        </span>
                        <span>{durationLabel(length)}</span>
                        <span>{LESSON_STATUS_LABELS[status]}</span>
                    </span>
                }
            />
            <LessonForm
                action={updateLesson.bind(null, lesson.id)}
                submitLabel="Enregistrer"
                withStatus
                cancelHref={planningHref({ semaine: begin.date })}
                students={students
                    .filter((s) => s.status !== "archived" || s.id === lesson.studentId)
                    .map((s) => ({ id: s.id, label: `${s.lastName} ${s.firstName}` }))}
                instructors={instructors
                    .filter((i) => i.active || i.id === lesson.instructorId)
                    .map((i) => ({ id: i.id, label: `${i.firstName} ${i.lastName}` }))}
                cars={cars
                    .filter((c) => c.active || c.id === lesson.carId)
                    .map((c) => ({ id: c.id, label: c.label }))}
                initial={{
                    studentId: lesson.studentId,
                    instructorId: lesson.instructorId,
                    carId: lesson.carId ?? "",
                    kind,
                    status,
                    date: begin.date,
                    time: formatTime(begin.minutes),
                    duration: String(length),
                    notes: lesson.notes ?? "",
                }}
            />
        </>
    );
}
