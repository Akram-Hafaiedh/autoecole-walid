import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateCar } from "@/actions/cars";
import { PageHeader } from "@/components/admin/PageHeader";
import { CarForm } from "@/components/cars/CarForm";
import { PlateChip } from "@/components/cars/PlateChip";
import { ServicePill } from "@/components/cars/ServicePill";
import { Pill } from "@/components/ui/Pill";
import { requireAdmin } from "@/lib/auth";
import { serviceState } from "@/lib/cars";
import { isUuid, toDateInput } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Fiche véhicule" };

export default async function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();

    const { id } = await params;
    if (!isUuid(id)) notFound();

    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) notFound();

    return (
        <>
            <PageHeader
                back={{ href: "/admin/vehicules", label: "Véhicules" }}
                title={car.label}
                description={
                    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2">
                        <PlateChip plate={car.plate} />
                        <Pill tone={car.active ? "ok" : "neutral"}>{car.active ? "En service" : "Hors service"}</Pill>
                        {car.active && <ServicePill info={serviceState(car.nextServiceDate)} />}
                    </span>
                }
            />
            <CarForm
                action={updateCar.bind(null, car.id)}
                submitLabel="Enregistrer"
                initial={{
                    label: car.label,
                    plate: car.plate,
                    transmission: car.transmission,
                    status: car.active ? "active" : "inactive",
                    nextServiceDate: toDateInput(car.nextServiceDate),
                    notes: car.notes ?? "",
                }}
            />
        </>
    );
}
