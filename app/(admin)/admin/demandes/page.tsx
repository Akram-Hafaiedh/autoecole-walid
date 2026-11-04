import type { Metadata } from "next";
import Link from "next/link";
import { archiveProspect, deleteProspect, restoreProspect, setProspectStatus } from "@/actions/prospects";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { PROSPECT_STATUSES, PROSPECT_STATUS_LABELS, type ProspectStatusValue } from "@/lib/prospects";
import { offers } from "@/lib/site";
import { PAGE_SIZE, parsePage } from "@/lib/students";
import { btnGhost, btnPrimary, btnSecondary, input, panel } from "@/lib/ui";

export const metadata: Metadata = { title: "Demandes" };

const TONES: Record<ProspectStatusValue, PillTone> = { received: "warn", contacted: "info", enrolled: "ok", closed: "neutral" };

const ARCHIVED = "archivees";

const href = (filter: string | undefined, search: string, page = 1) => {
    const query = new URLSearchParams();
    if (filter) query.set("statut", filter);
    if (search) query.set("q", search);
    if (page > 1) query.set("page", String(page));
    const text = query.toString();
    return `/admin/demandes${text ? `?${text}` : ""}`;
};

export default async function RequestsPage({
    searchParams,
}: {
    searchParams: Promise<{ statut?: string; page?: string; q?: string }>;
}) {
    await requireAdmin();

    const params = await searchParams;
    const search = (params.q ?? "").trim().slice(0, 80);
    const showArchived = params.statut === ARCHIVED;
    const status = PROSPECT_STATUSES.find((value) => value === params.statut);
    const filter = showArchived ? ARCHIVED : status;

    // Archived requests are hidden unless asked for.
    const where = {
        archivedAt: showArchived ? { not: null } : null,
        ...(status && { status }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search } },
                { email: { contains: search, mode: "insensitive" as const } },
            ],
        }),
    };

    const [grouped, archivedCount, total] = await Promise.all([
        prisma.prospect.groupBy({ by: ["status"], where: { archivedAt: null }, _count: { _all: true } }),
        prisma.prospect.count({ where: { archivedAt: { not: null } } }),
        prisma.prospect.count({ where }),
    ]);
    const counts = Object.fromEntries(PROSPECT_STATUSES.map((value) => [value, 0])) as Record<ProspectStatusValue, number>;
    for (const row of grouped) counts[row.status] = row._count._all;
    const all = PROSPECT_STATUSES.reduce((sum, value) => sum + counts[value], 0);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(parsePage(params.page), totalPages);
    const requests = await prisma.prospect.findMany({
        where,
        // New requests first, then the most recent.
        orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
    });

    const offerName = new Map(offers.map((offer) => [offer.id, offer.name]));
    const chip = "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand";

    return (
        <>
            <PageHeader
                title="Demandes"
                description="Les personnes qui ont demandé à être rappelées depuis le site. Appelez-les, puis faites avancer leur statut."
            />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-2">
                {[undefined, ...PROSPECT_STATUSES, ARCHIVED].map((value) => {
                    const active = value === filter;
                    return (
                        <Link
                            key={value ?? "all"}
                            href={href(value, search)}
                            aria-current={active ? "page" : undefined}
                            className={`${chip} ${active ? "border-brand bg-brand-soft text-brand-ink" : "border-line-strong bg-surface text-muted hover:text-foreground"}`}
                        >
                            {value === ARCHIVED ? "Archivées" : value ? PROSPECT_STATUS_LABELS[value as ProspectStatusValue] : "Toutes"}
                            <span className="tabular-nums">
                                {value === ARCHIVED ? archivedCount : value ? counts[value as ProspectStatusValue] : all}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <form role="search" className="flex gap-2 lg:w-96">
                {filter && <input type="hidden" name="statut" value={filter} />}
                <label htmlFor="q" className="sr-only">
                    Rechercher une demande
                </label>
                <div className="relative min-w-0 flex-1">
                    <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                    <input id="q" name="q" type="search" defaultValue={search} placeholder="Nom, téléphone ou e-mail" className={`${input} pl-9`} />
                </div>
                <button type="submit" className={btnSecondary}>
                    Rechercher
                </button>
            </form>
            </div>

            <section className={`${panel} max-w-4xl`}>
                {requests.length === 0 ? (
                    <EmptyState
                        icon="mail"
                        action={
                            search || filter ? (
                                <Link href="/admin/demandes" className={btnSecondary}>
                                    Effacer les filtres
                                </Link>
                            ) : undefined
                        }
                    >
                        {all + archivedCount === 0
                            ? "Aucune demande pour l’instant. Elles arrivent ici quand quelqu’un remplit le formulaire de la page Contact."
                            : search
                              ? `Aucune demande ne correspond à « ${search} ».`
                              : showArchived
                                ? "Aucune demande archivée."
                                : "Aucune demande avec ce statut."}
                    </EmptyState>
                ) : (
                    <ul className="divide-y divide-line">
                        {requests.map((request) => (
                            <li key={request.id} className="flex flex-col gap-3 px-5 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium">{request.name}</p>
                                        <p className="mt-0.5 flex flex-wrap gap-x-4 text-sm text-muted">
                                            <a href={`tel:${request.phone.replace(/\s/g, "")}`} className="font-medium text-brand-ink hover:underline">
                                                {request.phone}
                                            </a>
                                            {request.email && (
                                                <a href={`mailto:${request.email}`} className="hover:underline">
                                                    {request.email}
                                                </a>
                                            )}
                                            <span>reçue le {formatDate(request.createdAt, "short")}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {request.interest && offerName.get(request.interest) && (
                                            <Pill tone="neutral">{offerName.get(request.interest)}</Pill>
                                        )}
                                        <Pill tone={TONES[request.status]}>{PROSPECT_STATUS_LABELS[request.status]}</Pill>
                                    </div>
                                </div>

                                {request.message && <p className="rounded-lg bg-surface-2 px-3.5 py-2.5 text-sm whitespace-pre-line">{request.message}</p>}

                                <div className="flex flex-wrap items-center gap-1">
                                    {request.archivedAt ? (
                                        <>
                                            <form action={restoreProspect.bind(null, request.id)}>
                                                <button type="submit" className={btnPrimary}>
                                                    Restaurer
                                                </button>
                                            </form>
                                            <ConfirmForm
                                                action={deleteProspect.bind(null, request.id)}
                                                message={`Supprimer définitivement la demande de ${request.name} ? Cette action est irréversible.`}
                                            >
                                                <button type="submit" className={`${btnGhost} text-danger hover:text-danger`}>
                                                    Supprimer définitivement
                                                </button>
                                            </ConfirmForm>
                                        </>
                                    ) : (
                                        <>
                                    {request.status === "received" && <StatusButton id={request.id} to="contacted" primary />}
                                    {request.status === "contacted" && <StatusButton id={request.id} to="enrolled" primary />}
                                    {(request.status === "received" || request.status === "contacted") && (
                                        <>
                                            <Link href={`/admin/eleves/nouveau?demande=${request.id}`} className={btnSecondary}>
                                                <Icon name="plus" className="size-4" />
                                                Créer l’élève
                                            </Link>
                                            <StatusButton id={request.id} to="closed" />
                                        </>
                                    )}
                                    {(request.status === "closed" || request.status === "enrolled") && (
                                        <StatusButton id={request.id} to="received" label="Rouvrir" />
                                    )}
                                    <form action={archiveProspect.bind(null, request.id)}>
                                        <button type="submit" className={btnGhost}>
                                            Archiver
                                        </button>
                                    </form>
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
                        <p className="text-sm text-muted tabular-nums">
                            {(page - 1) * PAGE_SIZE + 1} à {(page - 1) * PAGE_SIZE + requests.length} sur {total}
                        </p>
                        <nav aria-label="Pagination" className="flex items-center gap-2">
                            {page > 1 ? (
                                <Link href={href(filter, search, page - 1)} className={btnSecondary}>
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
                                <Link href={href(filter, search, page + 1)} className={btnSecondary}>
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

const ACTION_LABELS: Record<ProspectStatusValue, string> = {
    received: "Rouvrir",
    contacted: "Marquer comme contactée",
    enrolled: "Marquer comme inscrite",
    closed: "Sans suite",
};

function StatusButton({ id, to, primary, label }: { id: string; to: ProspectStatusValue; primary?: boolean; label?: string }) {
    return (
        <form action={setProspectStatus.bind(null, id, to)}>
            <button type="submit" className={primary ? btnPrimary : btnGhost}>
                {label ?? ACTION_LABELS[to]}
            </button>
        </form>
    );
}
