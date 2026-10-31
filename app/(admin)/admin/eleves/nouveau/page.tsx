import type { Metadata } from "next";
import { createStudent } from "@/actions/students";
import { PageHeader } from "@/components/admin/PageHeader";
import { StudentForm } from "@/components/students/StudentForm";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Nouvel élève" };

export default async function NewStudentPage() {
    await requireAdmin();

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
                    firstName: "",
                    lastName: "",
                    phone: "",
                    email: "",
                    birthDate: "",
                    nationalId: "",
                    licenceCategory: "B",
                    status: "active",
                    notes: "",
                }}
            />
        </>
    );
}
