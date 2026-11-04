"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUuid } from "@/lib/format";
import { parseStudentForm, type StudentFormState } from "@/lib/students";

export async function createStudent(
    _previous: StudentFormState,
    formData: FormData,
): Promise<StudentFormState> {
    await requireAdmin();

    const parsed = parseStudentForm(formData);
    if (!parsed.ok) {
        return { errors: parsed.errors, values: parsed.values, message: "Corrigez les champs en rouge." };
    }

    await prisma.student.create({ data: parsed.data });

    revalidatePath("/admin/eleves");
    redirect("/admin/eleves");
}

export async function updateStudent(
    id: string,
    _previous: StudentFormState,
    formData: FormData,
): Promise<StudentFormState> {
    await requireAdmin();

    if (!isUuid(id)) return { message: "Élève introuvable." };

    const parsed = parseStudentForm(formData);
    if (!parsed.ok) {
        return { errors: parsed.errors, values: parsed.values, message: "Corrigez les champs en rouge." };
    }

    const result = await prisma.student.updateMany({ where: { id }, data: parsed.data });
    if (result.count === 0) return { message: "Élève introuvable." };

    revalidatePath("/admin/eleves");
    redirect("/admin/eleves");
}

/** Puts a student away: hidden from the list, with their lessons and payments kept. */
export async function archiveStudent(id: string): Promise<void> {
    await requireAdmin();
    if (!isUuid(id)) return;

    await prisma.student.updateMany({ where: { id }, data: { status: "archived" } });
    revalidatePath("/admin/eleves");
    redirect("/admin/eleves");
}

/** Brings an archived student back, as an active student. */
export async function restoreStudent(id: string): Promise<void> {
    await requireAdmin();
    if (!isUuid(id)) return;

    await prisma.student.updateMany({ where: { id, status: "archived" }, data: { status: "active" } });
    revalidatePath("/admin/eleves");
    revalidatePath(`/admin/eleves/${id}`);
}
