import type { Metadata } from "next";
import Link from "next/link";
import { activateAccount, deactivateAccount, deletePendingAccount } from "@/actions/comptes";
import { PageHeader } from "@/components/admin/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { getSession, requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE, parsePage } from "@/lib/students";
import { btnGhost, btnPrimary, btnSecondary, panel } from "@/lib/ui";

export const metadata: Metadata = { title: "Comptes" };

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    await requireAdmin();
    const session = await getSession();

    const [total, pending] = await Promise.all([prisma.user.count(), prisma.user.count({ where: { role: "user" } })]);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(parsePage((await searchParams).page), totalPages);

    // Accounts waiting for approval come first.
    const users = await prisma.user.findMany({
        orderBy: [{ role: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const href = (target: number) => `/admin/comptes${target > 1 ? `?page=${target}` : ""}`;

    return (
        <>
            <PageHeader
                title="Comptes"
                description="Les personnes inscrites sur le site. Un compte n’ouvre le tableau de bord qu’une fois activé ici."
            />

            {pending > 0 && (
                <p className="mb-6 rounded-xl border border-warn-fg/30 bg-warn-bg px-4 py-3 text-sm font-medium text-warn-fg">
                    {pending} compte{pending > 1 ? "s" : ""} en attente d’activation.
                </p>
            )}

            <section className={`${panel} max-w-4xl`}>
                {users.length === 0 ? (
                    <EmptyState icon="user">Aucun compte pour l’instant.</EmptyState>
                ) : (
                    <ul className="divide-y divide-line">
                        {users.map((user) => {
                            const [first, ...rest] = user.name.trim().split(/\s+/);
                            const isSelf = user.id === session?.user.id;
                            const active = user.role === "admin";
                            return (
                                <li key={user.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
                                    <Avatar id={user.id} firstName={first ?? "?"} lastName={rest.join(" ")} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium">
                                            {user.name}
                                            {isSelf && <span className="ml-2 text-xs font-normal text-muted">(vous)</span>}
                                        </p>
                                        <p className="truncate text-sm text-muted">
                                            {user.email} · inscrit le {formatDate(user.createdAt, "short")}
                                        </p>
                                    </div>
                                    {active ? <Pill tone="ok">Administrateur</Pill> : <Pill tone="warn">En attente</Pill>}
                                    <div className="flex items-center gap-1">
                                        {!active && (
                                            <>
                                                <form action={activateAccount.bind(null, user.id)}>
                                                    <button type="submit" className={btnPrimary}>
                                                        Activer
                                                    </button>
                                                </form>
                                                <form action={deletePendingAccount.bind(null, user.id)}>
                                                    <button type="submit" className={btnGhost}>
                                                        Supprimer
                                                    </button>
                                                </form>
                                            </>
                                        )}
                                        {active && !isSelf && (
                                            <form action={deactivateAccount.bind(null, user.id)}>
                                                <button type="submit" className={btnSecondary}>
                                                    Retirer l’accès
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
                        <p className="text-sm text-muted tabular-nums">
                            {(page - 1) * PAGE_SIZE + 1} à {(page - 1) * PAGE_SIZE + users.length} sur {total}
                        </p>
                        <nav aria-label="Pagination" className="flex items-center gap-2">
                            {page > 1 ? (
                                <Link href={href(page - 1)} className={btnSecondary}>
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
                                <Link href={href(page + 1)} className={btnSecondary}>
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
                    </div>
                )}
            </section>
        </>
    );
}
