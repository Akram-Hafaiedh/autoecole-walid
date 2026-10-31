import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { PlateChip } from "@/components/cars/PlateChip";
import { ServicePill } from "@/components/cars/ServicePill";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { requireAdmin } from "@/lib/auth";
import { TRANSMISSION_LABELS, serviceState, type TransmissionValue } from "@/lib/cars";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { btnPrimary } from "@/lib/ui";

export const metadata: Metadata = { title: "Véhicules" };

export default async function CarsPage() {
    await requireAdmin();

    const cars = await prisma.car.findMany({
        orderBy: [{ active: "desc" }, { label: "asc" }, { id: "asc" }],
        select: {
            id: true,
            label: true,
            plate: true,
            transmission: true,
            active: true,
            nextServiceDate: true,
            _count: {
                select: { lessons: { where: { startsAt: { gte: new Date() }, status: "scheduled" as const } } },
            },
        },
    });

    const activeCount = cars.filter((car) => car.active).length;

    return (
        <>
            <PageHeader
                title="Véhicules"
                description={
                    cars.length === 0
                        ? "Aucun véhicule pour l’instant"
                        : `${activeCount} véhicule${activeCount > 1 ? "s" : ""} en service`
                }
                actions={
                    <Link href="/admin/vehicules/nouveau" className={btnPrimary}>
                        <Icon name="plus" className="size-4" />
                        Nouveau véhicule
                    </Link>
                }
            />

            {cars.length === 0 ? (
                <div className="rounded-2xl border border-line bg-surface">
                    <EmptyState icon="car">
                        Aucun véhicule pour l’instant. Ajoutez le premier avec « Nouveau véhicule ». Il sera ensuite
                        proposé dans le planning.
                    </EmptyState>
                </div>
            ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {cars.map((car) => {
                        const service = serviceState(car.nextServiceDate);
                        const upcoming = car._count.lessons;
                        return (
                            <li
                                key={car.id}
                                className={`relative rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong hover:bg-surface-2 ${
                                    car.active ? "" : "opacity-70"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <Link
                                            href={`/admin/vehicules/${car.id}`}
                                            className="block truncate font-display text-base font-semibold after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                        >
                                            {car.label}
                                        </Link>
                                        <p className="mt-0.5 text-sm text-muted">
                                            {TRANSMISSION_LABELS[car.transmission as TransmissionValue]}
                                        </p>
                                    </div>
                                    <PlateChip plate={car.plate} />
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {car.active ? (
                                        <ServicePill info={service} />
                                    ) : (
                                        <Pill tone="neutral">Hors service</Pill>
                                    )}
                                </div>

                                <dl className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
                                    <div>
                                        <dt className="sr-only">Prochain entretien</dt>
                                        <dd className="text-muted tabular-nums">
                                            {car.nextServiceDate
                                                ? `Entretien le ${formatDate(car.nextServiceDate, "short")}`
                                                : "Aucune date d’entretien"}
                                        </dd>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <dt className="sr-only">Leçons à venir</dt>
                                        <dd className={upcoming > 0 ? "font-medium" : "text-muted"}>
                                            {upcoming > 0 ? `${upcoming} leçon${upcoming > 1 ? "s" : ""} à venir` : "Aucune leçon"}
                                        </dd>
                                    </div>
                                </dl>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}
