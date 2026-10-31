import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusPill } from "@/components/students/StatusPill";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    PAGE_SIZE,
    STATUS_LABELS,
    STUDENT_STATUSES,
    formatDate,
    parsePage,
    studentsHref,
    type StudentStatusValue,
} from "@/lib/students";
import { btnPrimary, btnSecondary, input, panel } from "@/lib/ui";

export const metadata: Metadata = { title: "Élèves" };

type SearchParams = Promise<{ q?: string; statut?: string; page?: string }>;

const tabLabels: Record<StudentStatusValue, string> = {
    active: "Actifs",
    paused: "En pause",
    completed: "Terminés",
    archived: "Archivés",
};

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
    await requireAdmin();

    const params = await searchParams;
    const search = (params.q ?? "").trim().slice(0, 80);
    const filter = (STUDENT_STATUSES as readonly string[]).includes(params.statut ?? "")
        ? (params.statut as StudentStatusValue)
        : undefined;

    const where = {
        // Archived students are hidden unless asked for.
        status: filter ?? { not: "archived" as const },
        ...(search && {
            OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search } },
            ],
        }),
    };

    const [total, grouped] = await Promise.all([
        prisma.student.count({ where }),
        prisma.student.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    // A page number past the end (for example after a filter change) shows the last page.
    const page = Math.min(parsePage(params.page), totalPages);

    const students = await prisma.student.findMany({
        where,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        // The national ID is deliberately not loaded in the list.
        select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            licenceCategory: true,
            status: true,
            createdAt: true,
        },
    });

    const byStatus = Object.fromEntries(STUDENT_STATUSES.map((status) => [status, 0])) as Record<
        StudentStatusValue,
        number
    >;
    for (const row of grouped) byStatus[row.status as StudentStatusValue] = row._count._all;
    const notArchived = byStatus.active + byStatus.paused + byStatus.completed;

    const tabs: { label: string; value: StudentStatusValue | undefined; count: number }[] = [
        { label: "Tous", value: undefined, count: notArchived },
        ...STUDENT_STATUSES.map((status) => ({ label: tabLabels[status], value: status, count: byStatus[status] })),
    ];

    const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const last = (page - 1) * PAGE_SIZE + students.length;
    const keep = { q: search, statut: filter };

    return (
        <>
            <PageHeader
                title="Élèves"
                description={
                    filter
                        ? `${total} élève${total > 1 ? "s" : ""} · ${STATUS_LABELS[filter]}`
                        : `${notArchived} élève${notArchived > 1 ? "s" : ""} suivis, sans les archivés`
                }
                actions={
                    <Link href="/admin/eleves/nouveau" className={btnPrimary}>
                        <Icon name="plus" className="size-4" />
                        Nouvel élève
                    </Link>
                }
            />

            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <nav aria-label="Filtrer par statut" className="-mx-1 overflow-x-auto px-1">
                    <ul className="flex gap-1.5">
                        {tabs.map((tab) => {
                            const active = tab.value === filter;
                            return (
                                <li key={tab.label} className="shrink-0">
                                    <Link
                                        href={studentsHref({ q: search, statut: tab.value })}
                                        aria-current={active ? "page" : undefined}
                                        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand ${active
                                                ? "bg-brand-soft text-brand-ink"
                                                : "text-muted hover:bg-line/60 hover:text-foreground"
                                            }`}
                                    >
                                        {tab.label}
                                        <span className="text-xs tabular-nums opacity-70">{tab.count}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <form role="search" className="flex gap-2 lg:w-96">
                    {filter && <input type="hidden" name="statut" value={filter} />}
                    <label htmlFor="q" className="sr-only">
                        Rechercher un élève
                    </label>
                    <div className="relative min-w-0 flex-1">
                        <Icon
                            name="search"
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                        />
                        <input
                            id="q"
                            name="q"
                            type="search"
                            defaultValue={search}
                            placeholder="Nom, prénom ou téléphone"
                            className={`${input} pl-9`}
                        />
                    </div>
                    <button type="submit" className={btnSecondary}>
                        Rechercher
                    </button>
                </form>
            </div>

            <section className={`${panel} overflow-hidden`}>
                {students.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                        <span className="inline-flex size-11 items-center justify-center rounded-full bg-surface-2 text-muted">
                            <Icon name="users" className="size-6" />
                        </span>
                        <p className="max-w-sm text-sm text-muted">
                            {search || filter
                                ? "Aucun élève ne correspond à cette recherche."
                                : "Aucun élève pour l’instant. Ajoutez le premier avec « Nouvel élève »."}
                        </p>
                        {(search || filter) && (
                            <Link href="/admin/eleves" className={btnSecondary}>
                                Effacer les filtres
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-line bg-surface-2 text-xs font-medium text-muted">
                                <tr>
                                    <th scope="col" className="px-5 py-3 font-medium">
                                        Élève
                                    </th>
                                    <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">
                                        Permis
                                    </th>
                                    <th scope="col" className="px-3 py-3 font-medium">
                                        Statut
                                    </th>
                                    <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell">
                                        Inscrit le
                                    </th>
                                    <th scope="col" className="w-10 py-3 pr-4">
                                        <span className="sr-only">Ouvrir la fiche</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {students.map((student) => (
                                    <tr key={student.id} className="relative transition-colors hover:bg-surface-2">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <StudentAvatar
                                                    id={student.id}
                                                    firstName={student.firstName}
                                                    lastName={student.lastName}
                                                />
                                                <div className="min-w-0">
                                                    <Link
                                                        href={`/admin/eleves/${student.id}`}
                                                        className="block truncate font-medium after:absolute after:inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
                                                    >
                                                        {student.firstName} {student.lastName}
                                                    </Link>
                                                    <span className="block truncate text-xs text-muted tabular-nums">
                                                        {student.phone ?? "Pas de téléphone"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden px-3 py-3 sm:table-cell">
                                            <span className="inline-flex h-7 min-w-8 items-center justify-center rounded-md border border-line-strong px-1.5 font-display text-xs font-bold">
                                                {student.licenceCategory}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <StatusPill status={student.status as StudentStatusValue} />
                                        </td>
                                        <td className="hidden px-3 py-3 text-muted tabular-nums md:table-cell">
                                            {formatDate(student.createdAt, "short")}
                                        </td>
                                        <td className="py-3 pr-4 text-muted">
                                            <Icon name="chevronRight" className="size-4" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {total > 0 && (
                    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
                        <p className="text-sm text-muted tabular-nums">
                            {first} à {last} sur {total}
                        </p>
                        {totalPages > 1 && (
                            <nav aria-label="Pagination" className="flex items-center gap-2">
                                {page > 1 ? (
                                    <Link href={studentsHref({ ...keep, page: page - 1 })} className={btnSecondary}>
                                        <Icon name="chevronLeft" className="size-4" />
                                        Précédent
                                    </Link>
                                ) : (
                                    <span aria-disabled="true" className={`${btnSecondary} pointer-events-none opacity-40`}>
                                        <Icon name="chevronLeft" className="size-4" />
                                        Précédent
                                    </span>
                                )}
                                <span className="px-1 text-sm text-muted tabular-nums">
                                    {page} / {totalPages}
                                </span>
                                {page < totalPages ? (
                                    <Link href={studentsHref({ ...keep, page: page + 1 })} className={btnSecondary}>
                                        Suivant
                                        <Icon name="chevronRight" className="size-4" />
                                    </Link>
                                ) : (
                                    <span aria-disabled="true" className={`${btnSecondary} pointer-events-none opacity-40`}>
                                        Suivant
                                        <Icon name="chevronRight" className="size-4" />
                                    </span>
                                )}
                            </nav>
                        )}
                    </div>
                )}
            </section>
        </>
    );
}
