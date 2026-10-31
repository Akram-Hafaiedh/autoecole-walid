import type { Metadata } from "next";
import { createCar } from "@/actions/cars";
import { PageHeader } from "@/components/admin/PageHeader";
import { CarForm } from "@/components/cars/CarForm";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Nouveau véhicule" };

export default async function NewCarPage() {
    await requireAdmin();

    return (
        <>
            <PageHeader
                title="Nouveau véhicule"
                description="Le nom et l’immatriculation sont obligatoires."
                back={{ href: "/admin/vehicules", label: "Véhicules" }}
            />
            <CarForm
                action={createCar}
                submitLabel="Ajouter le véhicule"
                initial={{ label: "", plate: "", transmission: "manual", status: "active", nextServiceDate: "", notes: "" }}
            />
        </>
    );
}
