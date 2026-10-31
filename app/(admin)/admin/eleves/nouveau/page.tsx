import type { Metadata } from "next";
import { createStudent } from "@/actions/students";
import { StudentForm } from "@/components/students/StudentForm";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Nouvel élève" };

export default async function NewStudentPage() {
    await requireAdmin();

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-2xl font-semibold tracking-tight">Nouvel élève</h1>
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
        </div>
    );
}
