import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateStudent } from "@/actions/students";
import { StudentForm } from "@/components/students/StudentForm";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUuid, toDateInput } from "@/lib/students";

export const metadata: Metadata = { title: "Fiche élève" };

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();

    const { id } = await params;
    if (!isUuid(id)) notFound();

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) notFound();

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="text-2xl font-semibold tracking-tight">
                {student.firstName} {student.lastName}
            </h1>
            <p className="mt-1 mb-6 text-sm text-muted">
                Inscrit le {student.createdAt.toISOString().slice(0, 10)}. Pour retirer un élève de la liste,
                passez son statut à « Archivé ».
            </p>
            <StudentForm
                action={updateStudent.bind(null, student.id)}
                submitLabel="Enregistrer"
                initial={{
                    firstName: student.firstName,
                    lastName: student.lastName,
                    phone: student.phone ?? "",
                    email: student.email ?? "",
                    birthDate: toDateInput(student.birthDate),
                    nationalId: student.nationalId ?? "",
                    licenceCategory: student.licenceCategory,
                    status: student.status,
                    notes: student.notes ?? "",
                }}
            />
        </div>
    );
}
