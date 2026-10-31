"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { CAR_FIELDS, parseCarForm, type CarFormState } from "@/lib/cars";
import { isUniqueViolation } from "@/lib/db-errors";
import { isUuid } from "@/lib/format";
import { readFields } from "@/lib/form";
import { prisma } from "@/lib/prisma";

const FIX_FIELDS = "Corrigez les champs en rouge.";
const PLATE_TAKEN = "Un véhicule avec cette immatriculation existe déjà.";

export async function createCar(_previous: CarFormState, formData: FormData): Promise<CarFormState> {
    await requireAdmin();

    const parsed = parseCarForm(formData);
    if (!parsed.ok) return { errors: parsed.errors, values: parsed.values, message: FIX_FIELDS };

    try {
        await prisma.car.create({ data: parsed.data });
    } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        return { errors: { plate: PLATE_TAKEN }, values: readFields(formData, CAR_FIELDS), message: FIX_FIELDS };
    }

    revalidatePath("/admin/vehicules");
    redirect("/admin/vehicules");
}

export async function updateCar(id: string, _previous: CarFormState, formData: FormData): Promise<CarFormState> {
    await requireAdmin();

    if (!isUuid(id)) return { message: "Véhicule introuvable." };

    const parsed = parseCarForm(formData);
    if (!parsed.ok) return { errors: parsed.errors, values: parsed.values, message: FIX_FIELDS };

    try {
        const result = await prisma.car.updateMany({ where: { id }, data: parsed.data });
        if (result.count === 0) return { message: "Véhicule introuvable." };
    } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        return { errors: { plate: PLATE_TAKEN }, values: readFields(formData, CAR_FIELDS), message: FIX_FIELDS };
    }

    revalidatePath("/admin/vehicules");
    redirect("/admin/vehicules");
}
