import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    PAGE_SIZE,
    STATUS_LABELS,
    STUDENT_STATUSES,
    parsePage,
    studentsHref,
    type StudentStatusValue,
} from "@/lib/students";
import { btnPrimary, btnSecondary } from "@/lib/ui";

export const metadata: Metadata = { title: "Élèves" };

type SearchParams = Promise<{ q?: string; statut?: string; page?: string }>;

const statusStyle: Record<StudentStatusValue, string> = {
    active: "bg-brand/15 text-brand",
    paused: "bg-accent/25 text-foreground",
    completed: "bg-line text-muted",
    archived: "bg-line text-muted",
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

    const total = await prisma.student.count({ where });
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
        },
    });

    const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const last = (page - 1) * PAGE_SIZE + students.length;
    const keep = { q: search, statut: filter };

    return (
        <div className="mx-auto max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Élèves</h1>
                <Link href="/admin/eleves/nouveau" className={btnPrimary}>
                    Nouvel élève
                </Link>
            </div>

            <form className="mt-6 flex flex-wrap gap-3" role="search">
                <label htmlFor="q" className="sr-only">
                    Rechercher
                </label>
                <input
                    id="q"
                    name="q"
                    type="search"
                    defaultValue={search}
                    placeholder="Nom, prénom ou téléphone"
                    className="min-w-0 flex-1 basis-56 rounded-md border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                />
                <label htmlFor="statut" className="sr-only">
                    Statut
                </label>
                <select
                    id="statut"
                    name="statut"
                    defaultValue={filter ?? ""}
                    className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
                >
                    <option value="">Tous sauf archivés</option>
                    {STUDENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                        </option>
                    ))}
                </select>
                <button type="submit" className={btnSecondary}>
                    Filtrer
                </button>
            </form>

            <p className="mt-4 text-sm text-muted tabular-nums">
                {total} élève{total > 1 ? "s" : ""}
                {total > 0 && ` · affichés : ${first} à ${last}`}
            </p>

            {students.length === 0 ? (
                <p className="mt-4 rounded-lg border border-line bg-surface p-6 text-sm text-muted">
                    {search || filter
                        ? "Aucun élève ne correspond à cette recherche."
                        : "Aucun élève pour l’instant. Ajoutez le premier avec « Nouvel élève »."}
                </p>
            ) : (
                <div className="mt-2 overflow-x-auto rounded-lg border border-line bg-surface">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                            <tr>
                                <th className="px-4 py-2 font-medium">Nom</th>
                                <th className="px-4 py-2 font-medium">Téléphone</th>
                                <th className="px-4 py-2 font-medium">Permis</th>
                                <th className="px-4 py-2 font-medium">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id} className="border-b border-line last:border-0">
                                    <td className="px-4 py-2.5">
                                        <Link
                                            href={`/admin/eleves/${student.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {student.lastName.toUpperCase()} {student.firstName}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2.5 tabular-nums">{student.phone ?? "–"}</td>
                                    <td className="px-4 py-2.5">{student.licenceCategory}</td>
                                    <td className="px-4 py-2.5">
                                        <span
                                            className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyle[student.status as StudentStatusValue]}`}
                                        >
                                            {STATUS_LABELS[student.status as StudentStatusValue]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
                    {page > 1 ? (
                        <Link href={studentsHref({ ...keep, page: page - 1 })} className={btnSecondary}>
                            Précédent
                        </Link>
                    ) : (
                        <span aria-disabled="true" className={`${btnSecondary} pointer-events-none opacity-40`}>
                            Précédent
                        </span>
                    )}
                    <p className="text-sm text-muted tabular-nums">
                        Page {page} sur {totalPages}
                    </p>
                    {page < totalPages ? (
                        <Link href={studentsHref({ ...keep, page: page + 1 })} className={btnSecondary}>
                            Suivant
                        </Link>
                    ) : (
                        <span aria-disabled="true" className={`${btnSecondary} pointer-events-none opacity-40`}>
                            Suivant
                        </span>
                    )}
                </nav>
            )}
        </div>
    );
}
