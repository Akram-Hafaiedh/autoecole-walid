import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateInstructor } from "@/actions/instructors";
import { PageHeader } from "@/components/admin/PageHeader";
import { InstructorForm } from "@/components/instructors/InstructorForm";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { requireAdmin } from "@/lib/auth";
import { formatDate, isUuid } from "@/lib/format";
import { planningHref } from "@/lib/planning";
import { prisma } from "@/lib/prisma";
import { btnSecondary } from "@/lib/ui";

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
                actions={
                    <Link href={planningHref({ moniteur: instructor.id })} className={btnSecondary}>
                        <Icon name="calendar" className="size-4" />
                        Voir son planning
                    </Link>
                }
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
