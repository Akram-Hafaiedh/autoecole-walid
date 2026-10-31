import type { Metadata } from "next";
import { createInstructor } from "@/actions/instructors";
import { PageHeader } from "@/components/admin/PageHeader";
import { InstructorForm } from "@/components/instructors/InstructorForm";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Nouveau moniteur" };

export default async function NewInstructorPage() {
    await requireAdmin();

    return (
        <>
            <PageHeader
                title="Nouveau moniteur"
                description="Le prénom et le nom sont obligatoires."
                back={{ href: "/admin/moniteurs", label: "Moniteurs" }}
            />
            <InstructorForm
                action={createInstructor}
                submitLabel="Ajouter le moniteur"
                initial={{ firstName: "", lastName: "", phone: "", email: "", status: "active" }}
            />
        </>
    );
}
