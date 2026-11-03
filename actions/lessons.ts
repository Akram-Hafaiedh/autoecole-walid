"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { chargeLesson, type ChargeSource } from "@/lib/billing";
import { isForeignKeyViolation } from "@/lib/db-errors";
import { isUuid } from "@/lib/format";
import { readFields } from "@/lib/form";
import {
    CONFLICT_SUBJECT,
    LESSON_FIELDS,
    conflictField,
    parseLessonForm,
    type ConflictField,
    type LessonFormState,
    type LessonInput,
} from "@/lib/lessons";
import { prisma } from "@/lib/prisma";
import { planningHref } from "@/lib/planning";
import { site } from "@/lib/site";
import { formatRange, utcToZoned } from "@/lib/time";

const FIX_FIELDS = "Corrigez les champs en rouge.";

type Errors = NonNullable<LessonFormState["errors"]>;

/**
 * Looks for lessons that overlap this one for the same instructor, car or student, and says
 * when each is busy. The database enforces the same rules and has the last word, so two people
 * saving at the same moment cannot both get through. This check only gives a clearer message.
 */
async function findConflicts(data: LessonInput, ignoreId?: string): Promise<Errors> {
    // A cancelled lesson takes no slot, and a lesson being cancelled does not need one.
    if (data.status === "cancelled") return {};

    const overlap = {
        startsAt: { lt: data.endsAt },
        endsAt: { gt: data.startsAt },
        status: { not: "cancelled" as const },
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
    };
    const select = { startsAt: true, endsAt: true };
    const orderBy = { startsAt: "asc" as const };

    const [instructorLesson, carLesson, studentLesson] = await Promise.all([
        prisma.lesson.findFirst({ where: { ...overlap, instructorId: data.instructorId }, select, orderBy }),
        data.carId ? prisma.lesson.findFirst({ where: { ...overlap, carId: data.carId }, select, orderBy }) : null,
        prisma.lesson.findFirst({ where: { ...overlap, studentId: data.studentId }, select, orderBy }),
    ]);

    const errors: Errors = {};
    const found: [ConflictField, { startsAt: Date; endsAt: Date } | null][] = [
        ["instructorId", instructorLesson],
        ["carId", carLesson],
        ["studentId", studentLesson],
    ];
    for (const [field, other] of found) {
        if (!other) continue;
        const from = utcToZoned(other.startsAt, site.timeZone).minutes;
        const length = Math.round((other.endsAt.getTime() - other.startsAt.getTime()) / 60_000);
        errors[field] = `${CONFLICT_SUBJECT[field]} a déjà une leçon de ${formatRange(from, from + length)} à ce moment-là.`;
    }
    return errors;
}

type SavedLesson = {
    status: string;
    kind: string;
    studentId: string;
    startsAt: Date;
    endsAt: Date;
    customPriceMode: string | null;
    customPrice: number | null;
    amount: number | null;
    chargeSource: ChargeSource | null;
};

const minutesOf = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / 60_000);

/**
 * What the lesson is billed, worked out when it is marked done (or absent) and then kept. A lesson
 * that is saved again with the same status, student, kind, length and price keeps the amount it
 * already has, so a price list changed later never rewrites an old lesson. A done lesson that had
 * no price (none was set yet) is worked out again.
 */
async function priceFor(data: LessonInput, saved?: SavedLesson) {
    const minutes = minutesOf(data.startsAt, data.endsAt);

    if (
        saved &&
        saved.amount !== null &&
        saved.status === data.status &&
        saved.kind === data.kind &&
        saved.studentId === data.studentId &&
        minutesOf(saved.startsAt, saved.endsAt) === minutes &&
        saved.customPriceMode === data.customPriceMode &&
        saved.customPrice === data.customPrice
    ) {
        return { amount: saved.amount, chargeSource: saved.chargeSource };
    }

    const [rate, studentRate, student] = await Promise.all([
        prisma.rate.findUnique({ where: { kind: data.kind } }),
        prisma.studentRate.findUnique({ where: { studentId_kind: { studentId: data.studentId, kind: data.kind } } }),
        prisma.student.findUnique({ where: { id: data.studentId }, select: { packageTotal: true } }),
    ]);

    const charge = chargeLesson({
        status: data.status,
        minutes,
        custom:
            data.customPriceMode && data.customPrice !== null
                ? { mode: data.customPriceMode, amount: data.customPrice }
                : null,
        studentRate: studentRate ? { mode: studentRate.mode, amount: studentRate.amount } : null,
        standardRate: rate ? { mode: rate.mode, amount: rate.amount, absenceFee: rate.absenceFee } : null,
        hasPackage: student?.packageTotal != null,
    });
    return { amount: charge.amount, chargeSource: charge.source };
}

/** Turns a database failure into a message on the form, or lets unknown errors through. */
function explain(error: unknown, formData: FormData): LessonFormState {
    const field = conflictField(error);
    if (field) {
        const errors: Errors = {};
        errors[field] = `${CONFLICT_SUBJECT[field]} a déjà une leçon à ce moment-là.`;
        return { errors, values: readFields(formData, LESSON_FIELDS), message: FIX_FIELDS };
    }
    if (isForeignKeyViolation(error)) {
        return { message: "L’élève, le moniteur ou le véhicule choisi n’existe plus. Rechargez la page." };
    }
    throw error;
}

export async function createLesson(_previous: LessonFormState, formData: FormData): Promise<LessonFormState> {
    await requireAdmin();

    const parsed = parseLessonForm(formData, site.timeZone);
    if (!parsed.ok) return { errors: parsed.errors, values: parsed.values, message: FIX_FIELDS };

    const conflicts = await findConflicts(parsed.data);
    if (Object.keys(conflicts).length > 0) {
        return { errors: conflicts, values: readFields(formData, LESSON_FIELDS), message: FIX_FIELDS };
    }

    try {
        await prisma.lesson.create({ data: { ...parsed.data, ...(await priceFor(parsed.data)) } });
    } catch (error) {
        return explain(error, formData);
    }

    revalidatePath("/admin/planning");
    redirect(planningHref({ semaine: parsed.date }));
}

export async function updateLesson(
    id: string,
    _previous: LessonFormState,
    formData: FormData,
): Promise<LessonFormState> {
    await requireAdmin();

    if (!isUuid(id)) return { message: "Leçon introuvable." };

    const parsed = parseLessonForm(formData, site.timeZone);
    if (!parsed.ok) return { errors: parsed.errors, values: parsed.values, message: FIX_FIELDS };

    const conflicts = await findConflicts(parsed.data, id);
    if (Object.keys(conflicts).length > 0) {
        return { errors: conflicts, values: readFields(formData, LESSON_FIELDS), message: FIX_FIELDS };
    }

    const saved = await prisma.lesson.findUnique({
        where: { id },
        select: {
            status: true,
            kind: true,
            studentId: true,
            startsAt: true,
            endsAt: true,
            customPriceMode: true,
            customPrice: true,
            amount: true,
            chargeSource: true,
        },
    });
    if (!saved) return { message: "Leçon introuvable." };

    try {
        const result = await prisma.lesson.updateMany({
            where: { id },
            data: { ...parsed.data, ...(await priceFor(parsed.data, saved)) },
        });
        if (result.count === 0) return { message: "Leçon introuvable." };
    } catch (error) {
        return explain(error, formData);
    }

    revalidatePath("/admin/planning");
    redirect(planningHref({ semaine: parsed.date }));
}
