import type { Metadata } from "next";
import { createStudent } from "@/actions/students";
import { PageHeader } from "@/components/admin/PageHeader";
import { StudentForm } from "@/components/students/StudentForm";
import { requireAdmin } from "@/lib/auth";
import { isUuid } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { splitName } from "@/lib/prospects";

export const metadata: Metadata = { title: "Nouvel élève" };

export default async function NewStudentPage({ searchParams }: { searchParams: Promise<{ demande?: string }> }) {
    await requireAdmin();

    // Coming from a request on /admin/demandes: start with what the person gave us.
    const { demande } = await searchParams;
    const request = demande && isUuid(demande) ? await prisma.prospect.findUnique({ where: { id: demande } }) : null;
    const name = request ? splitName(request.name) : { firstName: "", lastName: "" };

    return (
        <>
            <PageHeader
                title="Nouvel élève"
                description="Les champs prénom, nom et catégorie de permis sont obligatoires."
                back={{ href: "/admin/eleves", label: "Élèves" }}
            />
            <StudentForm
                action={createStudent}
                submitLabel="Ajouter l’élève"
                initial={{
                    firstName: name.firstName,
                    lastName: name.lastName,
                    phone: request?.phone ?? "",
                    email: request?.email ?? "",
                    birthDate: "",
                    nationalId: "",
                    licenceCategory: "B",
                    status: "active",
                    notes: request?.message ?? "",
                }}
            />
        </>
    );
}
