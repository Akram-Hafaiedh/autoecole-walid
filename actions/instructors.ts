"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isUuid } from "@/lib/format";
import { parseInstructorForm, type InstructorFormState } from "@/lib/instructors";
import { prisma } from "@/lib/prisma";

export async function createInstructor(
    _previous: InstructorFormState,
    formData: FormData,
): Promise<InstructorFormState> {
    await requireAdmin();

    const parsed = parseInstructorForm(formData);
    if (!parsed.ok) {
        return { errors: parsed.errors, values: parsed.values, message: "Corrigez les champs en rouge." };
    }

    await prisma.instructor.create({ data: parsed.data });

    revalidatePath("/admin/moniteurs");
    redirect("/admin/moniteurs");
}

export async function updateInstructor(
    id: string,
    _previous: InstructorFormState,
    formData: FormData,
): Promise<InstructorFormState> {
    await requireAdmin();

    if (!isUuid(id)) return { message: "Moniteur introuvable." };

    const parsed = parseInstructorForm(formData);
    if (!parsed.ok) {
        return { errors: parsed.errors, values: parsed.values, message: "Corrigez les champs en rouge." };
    }

    const result = await prisma.instructor.updateMany({ where: { id }, data: parsed.data });
    if (result.count === 0) return { message: "Moniteur introuvable." };

    revalidatePath("/admin/moniteurs");
    redirect("/admin/moniteurs");
}
