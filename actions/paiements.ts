"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
    STUDENT_PRICE_FIELDS,
    parsePaymentForm,
    parseStudentPrices,
    type GrantDiscountState,
    type PaymentFormState,
    type StudentPricesState,
} from "@/lib/student-billing";
import { chargeLesson, discountAvailable } from "@/lib/billing";
import { isUuid } from "@/lib/format";
import { readFields } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { utcToZoned } from "@/lib/time";

const FIX_FIELDS = "Corrigez les champs en rouge.";
const NOT_FOUND = "Élève introuvable.";

const refresh = (studentId: string) => revalidatePath(`/admin/eleves/${studentId}/paiements`);

/** The total price ("forfait") and the prices agreed with this student for each kind of lesson. */
export async function saveStudentPrices(
    studentId: string,
    _previous: StudentPricesState,
    formData: FormData,
): Promise<StudentPricesState> {
    await requireAdmin();
    if (!isUuid(studentId)) return { message: NOT_FOUND };

    const parsed = parseStudentPrices(formData);
    if (!parsed.ok) return { errors: parsed.errors, values: parsed.values, message: FIX_FIELDS };

    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!student) return { message: NOT_FOUND };

    await prisma.$transaction([
        prisma.student.update({ where: { id: studentId }, data: { packageTotal: parsed.packageTotal } }),
        ...parsed.save.map((row) =>
            prisma.studentRate.upsert({
                where: { studentId_kind: { studentId, kind: row.kind } },
                create: { studentId, ...row },
                update: { mode: row.mode, amount: row.amount },
            }),
        ),
        prisma.studentRate.deleteMany({ where: { studentId, kind: { in: parsed.remove } } }),
    ]);

    refresh(studentId);
    return {
        message: "Prix enregistrés. Ils s’appliquent aux leçons marquées « Effectuée » à partir de maintenant.",
        values: readFields(formData, STUDENT_PRICE_FIELDS),
    };
}

export async function addPayment(
    studentId: string,
    _previous: PaymentFormState,
    formData: FormData,
): Promise<PaymentFormState> {
    await requireAdmin();
    if (!isUuid(studentId)) return { message: NOT_FOUND };

    const today = utcToZoned(new Date(), site.timeZone).date;
    const parsed = parsePaymentForm(formData, today);
    if (!parsed.ok) return { errors: parsed.errors, values: parsed.values, message: FIX_FIELDS };

    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!student) return { message: NOT_FOUND };

    await prisma.payment.create({ data: { studentId, ...parsed.data } });

    refresh(studentId);
    // An empty values object resets the form for the next payment.
    return { message: "Paiement enregistré.", values: { amount: "", paidOn: today, method: parsed.data.method, note: "" } };
}

/** A payment is never deleted: it is marked cancelled and no longer counted. */
export async function voidPayment(id: string): Promise<void> {
    await requireAdmin();
    if (!isUuid(id)) return;

    const payment = await prisma.payment.findUnique({ where: { id }, select: { studentId: true, voidedAt: true } });
    if (!payment || payment.voidedAt) return;

    await prisma.payment.update({ where: { id }, data: { voidedAt: new Date() } });
    refresh(payment.studentId);
}

/** Gives the student a discount from the school's list. The offer is copied, so editing it later changes nothing for them. */
export async function grantDiscount(
    studentId: string,
    _previous: GrantDiscountState,
    formData: FormData,
): Promise<GrantDiscountState> {
    await requireAdmin();
    if (!isUuid(studentId)) return { message: NOT_FOUND };

    const discountId = String(formData.get("discountId") ?? "");
    if (!isUuid(discountId)) return { errors: { discountId: "Choisissez une remise." } };

    const [student, discount, already] = await Promise.all([
        prisma.student.findUnique({ where: { id: studentId }, select: { id: true } }),
        prisma.discount.findUnique({ where: { id: discountId } }),
        prisma.studentDiscount.findFirst({ where: { studentId, discountId, voidedAt: null }, select: { id: true } }),
    ]);
    if (!student) return { message: NOT_FOUND };
    if (!discount) return { errors: { discountId: "Remise introuvable." } };
    if (!discountAvailable(discount, new Date())) return { errors: { discountId: "Cette remise n’est plus disponible." } };
    if (already) return { errors: { discountId: "Cet élève a déjà cette remise." } };

    await prisma.studentDiscount.create({
        data: { studentId, discountId, label: discount.name, kind: discount.kind, value: discount.value },
    });

    refresh(studentId);
    return { message: "Remise accordée." };
}

export async function voidDiscount(id: string): Promise<void> {
    await requireAdmin();
    if (!isUuid(id)) return;

    const row = await prisma.studentDiscount.findUnique({ where: { id }, select: { studentId: true, voidedAt: true } });
    if (!row || row.voidedAt) return;

    await prisma.studentDiscount.update({ where: { id }, data: { voidedAt: new Date() } });
    refresh(row.studentId);
}

/**
 * Prices the done or absent lessons that were saved before any price existed. Lessons that
 * already have an amount are never touched.
 */
export async function priceUnpricedLessons(studentId: string): Promise<void> {
    await requireAdmin();
    if (!isUuid(studentId)) return;

    const [lessons, rates, studentRates, student] = await Promise.all([
        prisma.lesson.findMany({
            where: { studentId, status: { in: ["completed", "no_show"] }, amount: null },
            select: { id: true, status: true, kind: true, startsAt: true, endsAt: true, customPriceMode: true, customPrice: true },
        }),
        prisma.rate.findMany(),
        prisma.studentRate.findMany({ where: { studentId } }),
        prisma.student.findUnique({ where: { id: studentId }, select: { packageTotal: true } }),
    ]);

    for (const lesson of lessons) {
        const rate = rates.find((r) => r.kind === lesson.kind);
        const own = studentRates.find((r) => r.kind === lesson.kind);
        const charge = chargeLesson({
            status: lesson.status,
            minutes: Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60_000),
            custom:
                lesson.customPriceMode && lesson.customPrice !== null
                    ? { mode: lesson.customPriceMode, amount: lesson.customPrice }
                    : null,
            studentRate: own ? { mode: own.mode, amount: own.amount } : null,
            standardRate: rate ? { mode: rate.mode, amount: rate.amount, absenceFee: rate.absenceFee } : null,
            hasPackage: student?.packageTotal != null,
        });
        if (charge.amount === null) continue;
        await prisma.lesson.update({ where: { id: lesson.id }, data: { amount: charge.amount, chargeSource: charge.source } });
    }

    refresh(studentId);
}

