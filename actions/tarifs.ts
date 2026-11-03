"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { DISCOUNT_FIELDS, parseDiscountForm, type DiscountFormState } from "@/lib/discounts";
import { isUuid } from "@/lib/format";
import { readFields } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { RATE_FIELDS, parseRatesForm, type RatesFormState } from "@/lib/rates";

const FIX_FIELDS = "Corrigez les champs en rouge.";

export async function saveRates(_previous: RatesFormState, formData: FormData): Promise<RatesFormState> {
    await requireAdmin();

    const parsed = parseRatesForm(formData);
    if (!parsed.ok) return { errors: parsed.errors, values: parsed.values, message: FIX_FIELDS };

    await prisma.$transaction([
        ...parsed.save.map((row) =>
            prisma.rate.upsert({
                where: { kind: row.kind },
                create: row,
                update: { mode: row.mode, amount: row.amount, absenceFee: row.absenceFee },
            }),
        ),
        prisma.rate.deleteMany({ where: { kind: { in: parsed.remove } } }),
    ]);

    revalidatePath("/admin/tarifs");
    return {
        message: "Tarifs enregistrés. Ils s’appliquent aux leçons marquées « Effectuée » à partir de maintenant.",
        values: readFields(formData, RATE_FIELDS),
    };
}

export async function createDiscount(_previous: DiscountFormState, formData: FormData): Promise<DiscountFormState> {
    await requireAdmin();

    const parsed = parseDiscountForm(formData);
    if (!parsed.ok) return { errors: parsed.errors, values: parsed.values, message: FIX_FIELDS };

    await prisma.discount.create({ data: parsed.data });

    revalidatePath("/admin/tarifs");
    redirect("/admin/tarifs");
}

export async function updateDiscount(
    id: string,
    _previous: DiscountFormState,
    formData: FormData,
): Promise<DiscountFormState> {
    await requireAdmin();

    if (!isUuid(id)) return { message: "Remise introuvable." };

    const parsed = parseDiscountForm(formData);
    if (!parsed.ok) return { errors: parsed.errors, values: parsed.values, message: FIX_FIELDS };

    // Students who already received this discount keep what they were given.
    const result = await prisma.discount.updateMany({ where: { id }, data: parsed.data });
    if (result.count === 0) return { message: "Remise introuvable." };

    revalidatePath("/admin/tarifs");
    redirect("/admin/tarifs");
}

/** Turns an offer off or on without editing it. */
export async function toggleDiscount(id: string): Promise<void> {
    await requireAdmin();
    if (!isUuid(id)) return;

    const current = await prisma.discount.findUnique({ where: { id }, select: { active: true } });
    if (!current) return;

    await prisma.discount.update({ where: { id }, data: { active: !current.active } });
    revalidatePath("/admin/tarifs");
}
