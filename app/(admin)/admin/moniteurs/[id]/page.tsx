import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateInstructor } from "@/actions/instructors";
import { PageHeader } from "@/components/admin/PageHeader";
import { InstructorForm } from "@/components/instructors/InstructorForm";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { requireAdmin } from "@/lib/auth";
import { formatDate, isUuid } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Fiche moniteur" };

export default async function EditInstructorPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();

    const { id } = await params;
    if (!isUuid(id)) notFound();

    const instructor = await prisma.instructor.findUnique({ where: { id } });
    if (!instructor) notFound();

    return (
        <>
            <PageHeader
                back={{ href: "/admin/moniteurs", label: "Moniteurs" }}
                leading={
                    <Avatar id={instructor.id} firstName={instructor.firstName} lastName={instructor.lastName} size="lg" />
                }
                title={`${instructor.firstName} ${instructor.lastName}`}
                description={
                    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Pill tone={instructor.active ? "ok" : "neutral"}>{instructor.active ? "Actif" : "Inactif"}</Pill>
                        <span>Ajouté le {formatDate(instructor.createdAt)}</span>
                    </span>
                }
            />
            <InstructorForm
                action={updateInstructor.bind(null, instructor.id)}
                submitLabel="Enregistrer"
                initial={{
                    firstName: instructor.firstName,
                    lastName: instructor.lastName,
                    phone: instructor.phone ?? "",
                    email: instructor.email ?? "",
                    status: instructor.active ? "active" : "inactive",
                }}
            />
        </>
    );
}
