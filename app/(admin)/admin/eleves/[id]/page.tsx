import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateStudent } from "@/actions/students";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusPill } from "@/components/students/StatusPill";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { StudentForm } from "@/components/students/StudentForm";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, isUuid, toDateInput, type StudentStatusValue } from "@/lib/students";

export const metadata: Metadata = { title: "Fiche élève" };

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();

    const { id } = await params;
    if (!isUuid(id)) notFound();

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) notFound();

    return (
        <>
            <PageHeader
                back={{ href: "/admin/eleves", label: "Élèves" }}
                leading={
                    <StudentAvatar id={student.id} firstName={student.firstName} lastName={student.lastName} size="lg" />
                }
                title={`${student.firstName} ${student.lastName}`}
                description={
                    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                        <StatusPill status={student.status as StudentStatusValue} />
                        <span>Inscrit le {formatDate(student.createdAt)}</span>
                    </span>
                }
            />
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
        </>
    );
}
