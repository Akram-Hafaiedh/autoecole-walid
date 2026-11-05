import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { requireAdmin } from "@/lib/auth";
import { teachesLabel } from "@/lib/instructors";
import { prisma } from "@/lib/prisma";
import { btnPrimary } from "@/lib/ui";

export const metadata: Metadata = { title: "Moniteurs" };

export default async function InstructorsPage() {
    await requireAdmin();

    const instructors = await prisma.instructor.findMany({
        orderBy: [{ active: "desc" }, { lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
        select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            active: true,
            teachesCode: true,
            teachesDriving: true,
            _count: {
                select: { lessons: { where: { startsAt: { gte: new Date() }, status: "scheduled" as const } } },
            },
        },
    });

    const activeCount = instructors.filter((instructor) => instructor.active).length;

    return (
        <>
            <PageHeader
                title="Moniteurs"
                description={
                    instructors.length === 0
                        ? "Personne pour l’instant"
                        : `${activeCount} moniteur${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""}`
                }
                actions={
                    <Link href="/admin/moniteurs/nouveau" className={btnPrimary}>
                        <Icon name="plus" className="size-4" />
                        Nouveau moniteur
                    </Link>
                }
            />

            {instructors.length === 0 ? (
                <div className="rounded-2xl border border-line bg-surface">
                    <EmptyState icon="user">
                        Aucun moniteur pour l’instant. Ajoutez le premier avec « Nouveau moniteur ». Il sera ensuite
                        proposé dans le planning.
                    </EmptyState>
                </div>
            ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {instructors.map((instructor) => {
                        const upcoming = instructor._count.lessons;
                        return (
                            <li
                                key={instructor.id}
                                className={`relative rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong hover:bg-surface-2 ${
                                    instructor.active ? "" : "opacity-70"
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <Avatar
                                        id={instructor.id}
                                        firstName={instructor.firstName}
                                        lastName={instructor.lastName}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={`/admin/moniteurs/${instructor.id}`}
                                            className="block truncate font-display text-base font-semibold after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                        >
                                            {instructor.firstName} {instructor.lastName}
                                        </Link>
                                        <p className="mt-0.5 truncate text-sm text-muted tabular-nums">
                                            {instructor.phone ?? "Pas de téléphone"}
                                        </p>
                                    </div>
                                    <Pill tone={instructor.active ? "ok" : "neutral"}>
                                        {instructor.active ? "Actif" : "Inactif"}
                                    </Pill>
                                </div>

                                <p className="mt-3 text-sm text-muted">{teachesLabel(instructor)}</p>

                                <dl className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
                                    <div className="min-w-0">
                                        <dt className="sr-only">E-mail</dt>
                                        <dd className="truncate text-muted">{instructor.email ?? "Pas d’e-mail"}</dd>
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
