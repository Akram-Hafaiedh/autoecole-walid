import { accountSummary } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

export type StudentBalance = { id: string; firstName: string; lastName: string; balance: number };

/**
 * What each student owes (positive) or has overpaid (negative), from their package, billed
 * lessons, discounts and payments. Only students with a non-zero balance are returned, the
 * ones who owe the most first.
 */
export async function studentBalances(): Promise<StudentBalance[]> {
    const students = await prisma.student.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            packageTotal: true,
            discounts: { where: { voidedAt: null }, select: { kind: true, value: true } },
            payments: { where: { voidedAt: null }, select: { amount: true } },
            lessons: { where: { status: { in: ["completed", "no_show"] } }, select: { status: true, amount: true } },
        },
    });

    return students
        .map((student) => ({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            balance: accountSummary({
                packageTotal: student.packageTotal,
                lessons: student.lessons,
                discounts: student.discounts,
                payments: student.payments.map((payment) => payment.amount),
            }).balance,
        }))
        .filter((student) => student.balance !== 0)
        .sort((a, b) => b.balance - a.balance);
}
