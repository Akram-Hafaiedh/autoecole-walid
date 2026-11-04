import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { ViewToggle } from "@/components/bilan/ViewToggle";
import { YearView } from "@/components/bilan/YearView";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/auth";
import { addMonths, hoursLabel, isMonth, monthBounds, monthLabel, summarizeMonth, type Tally } from "@/lib/bilan";
import { studentBalances } from "@/lib/finance";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { parsePage } from "@/lib/students";
import { site } from "@/lib/site";
import { utcToZoned, zonedTimeToUtc } from "@/lib/time";
import { parseDateOnly } from "@/lib/validation";
import { btnSecondary, panel } from "@/lib/ui";

export const metadata: Metadata = { title: "Bilan du mois" };

const OWED_PAGE_SIZE = 10;

export default async function MonthlySummaryPage({ searchParams }: { searchParams: Promise<{ mois?: string; page?: string; vue?: string; annee?: string }> }) {
    await requireAdmin();

    const { mois, page: pageParam, vue, annee } = await searchParams;
    if (vue === "annee") return <YearView annee={annee} />;

    const current = utcToZoned(new Date(), site.timeZone).date.slice(0, 7);
    const month = mois && isMonth(mois) ? mois : current;
    const { first, next } = monthBounds(month);

    const [lessons, payments, balances] = await Promise.all([
        prisma.lesson.findMany({
            where: {
                startsAt: { gte: zonedTimeToUtc(first, "00:00", site.timeZone), lt: zonedTimeToUtc(next, "00:00", site.timeZone) },
            },
            select: {
                instructorId: true,
                carId: true,
                status: true,
                startsAt: true,
                endsAt: true,
                amount: true,
                instructor: { select: { firstName: true, lastName: true } },
                car: { select: { label: true } },
            },
        }),
        prisma.payment.findMany({
            where: { voidedAt: null, paidOn: { gte: parseDateOnly(first)!, lt: parseDateOnly(next)! } },
            select: { amount: true },
        }),
        studentBalances(),
    ]);

    const summary = summarizeMonth(
        lessons.map((lesson) => ({
            instructorId: lesson.instructorId,
            carId: lesson.carId,
            status: lesson.status,
            minutes: Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60_000),
            amount: lesson.amount,
        })),
        payments.map((payment) => payment.amount),
    );

    const instructorNames = new Map(lessons.map((l) => [l.instructorId, `${l.instructor.firstName} ${l.instructor.lastName}`]));
    const carNames = new Map(lessons.map((l) => [l.carId, l.car?.label ?? "Sans véhicule"]));
    const instructorRows = [...summary.byInstructor].sort((a, b) => b[1].minutes - a[1].minutes);
    const carRows = [...summary.byCar].sort((a, b) => b[1].minutes - a[1].minutes);

    const owed = balances.filter((student) => student.balance > 0);
    const owedTotal = owed.reduce((sum, student) => sum + student.balance, 0);
    const totalPages = Math.max(1, Math.ceil(owed.length / OWED_PAGE_SIZE));
    const page = Math.min(parsePage(pageParam), totalPages);
    const owedPage = owed.slice((page - 1) * OWED_PAGE_SIZE, page * OWED_PAGE_SIZE);
    const pageHref = (target: number) => `/admin/bilan?mois=${month}${target > 1 ? `&page=${target}` : ""}`;
    const { total } = summary;

    return (
        <>
            <PageHeader
                title="Bilan du mois"
                description="Les leçons données, les heures, ce qui a été facturé et ce qui a été encaissé."
                actions={
                    <>
                    <ViewToggle active="month" monthHref={`/admin/bilan?mois=${month}`} yearHref={`/admin/bilan?vue=annee&annee=${month.slice(0, 4)}`} />
                    <nav aria-label="Mois" className="flex items-center gap-2">
                        <Link href={`/admin/bilan?mois=${addMonths(month, -1)}`} className={btnSecondary} aria-label="Mois précédent">
                            <Icon name="chevronLeft" className="size-4" />
                        </Link>
                        <span className="min-w-36 text-center font-display text-lg font-semibold capitalize">
                            {monthLabel(month)}
                        </span>
                        <Link href={`/admin/bilan?mois=${addMonths(month, 1)}`} className={btnSecondary} aria-label="Mois suivant">
                            <Icon name="chevronRight" className="size-4" />
                        </Link>
                    </nav>
                    </>
                }
            />

            <div className="grid max-w-5xl gap-10">
                <section aria-label="Chiffres du mois" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Figure label="Leçons effectuées" value={String(total.done)} note={total.absent ? `${total.absent} absence${total.absent > 1 ? "s" : ""}` : undefined} />
                    <Figure label="Heures données" value={hoursLabel(total.minutes)} />
                    <Figure label="Facturé" value={formatMoney(total.billed)} note={total.unpriced ? `${total.unpriced} leçon${total.unpriced > 1 ? "s" : ""} sans prix` : undefined} />
                    <Figure label="Encaissé" value={formatMoney(summary.received)} note="Paiements reçus ce mois-ci" />
                </section>

                {total.planned > 0 && (
                    <p className="-mt-6 text-sm text-muted">
                        {total.planned} leçon{total.planned > 1 ? "s" : ""} de ce mois n’{total.planned > 1 ? "ont" : "a"} pas encore
                        été marquée{total.planned > 1 ? "s" : ""} « Effectuée » ou « Absent » : elle{total.planned > 1 ? "s ne sont" : " n’est"} pas comptée{total.planned > 1 ? "s" : ""} ici.
                    </p>
                )}

                <Breakdown title="Par moniteur" rows={instructorRows.map(([id, tally]) => ({ key: id, name: instructorNames.get(id) ?? "—", tally }))} />
                <Breakdown title="Par véhicule" rows={carRows.map(([id, tally]) => ({ key: id ?? "none", name: carNames.get(id) ?? "—", tally }))} />

                <section aria-labelledby="owed-title">
                    <h2 id="owed-title" className="font-display text-xl font-semibold">
                        Élèves qui doivent de l’argent
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-muted">
                        Tous mois confondus : {owed.length} élève{owed.length > 1 ? "s" : ""}, {formatMoney(owedTotal)} au total.
                    </p>
                    {owed.length === 0 ? (
                        <p className={`${panel} p-5 text-sm text-muted`}>Personne ne doit d’argent pour le moment.</p>
                    ) : (
                        <div className={panel}>
                        <ul className="divide-y divide-line">
                            {owedPage.map((student) => (
                                <li key={student.id}>
                                    <Link
                                        href={`/admin/eleves/${student.id}/paiements`}
                                        className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-surface-2"
                                    >
                                        <span className="min-w-0 truncate font-medium">
                                            {student.firstName} {student.lastName}
                                        </span>
                                        <span className="font-display font-bold text-warn-fg tabular-nums">{formatMoney(student.balance)}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
                                <p className="text-sm text-muted tabular-nums">
                                    {(page - 1) * OWED_PAGE_SIZE + 1} à {(page - 1) * OWED_PAGE_SIZE + owedPage.length} sur {owed.length}
                                </p>
                                <nav aria-label="Pagination" className="flex items-center gap-2">
                                    {page > 1 ? (
                                        <Link href={pageHref(page - 1)} className={btnSecondary}>
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
                                        <Link href={pageHref(page + 1)} className={btnSecondary}>
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
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
    return (
        <div className={`${panel} p-4`}>
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p>
            {note && <p className="mt-1 text-xs text-muted">{note}</p>}
        </div>
    );
}

function Breakdown({ title, rows }: { title: string; rows: { key: string; name: string; tally: Tally }[] }) {
    return (
        <section>
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            {rows.length === 0 ? (
                <p className={`${panel} mt-4 p-5 text-sm text-muted`}>Aucune leçon ce mois-ci.</p>
            ) : (
                <div className={`${panel} mt-4 overflow-x-auto`}>
                    <table className="w-full min-w-[34rem] text-sm">
                        <thead>
                            <tr className="border-b border-line text-left text-xs text-muted">
                                <th scope="col" className="px-5 py-3 font-medium">Nom</th>
                                <th scope="col" className="px-3 py-3 text-right font-medium">Leçons</th>
                                <th scope="col" className="px-3 py-3 text-right font-medium">Heures</th>
                                <th scope="col" className="px-3 py-3 text-right font-medium">Absences</th>
                                <th scope="col" className="px-5 py-3 text-right font-medium">Facturé</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {rows.map(({ key, name, tally }) => (
                                <tr key={key}>
                                    <th scope="row" className="px-5 py-3 text-left font-medium">{name}</th>
                                    <td className="px-3 py-3 text-right tabular-nums">{tally.done}</td>
                                    <td className="px-3 py-3 text-right tabular-nums">{hoursLabel(tally.minutes)}</td>
                                    <td className="px-3 py-3 text-right tabular-nums">{tally.absent}</td>
                                    <td className="px-5 py-3 text-right font-medium tabular-nums">{formatMoney(tally.billed)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
