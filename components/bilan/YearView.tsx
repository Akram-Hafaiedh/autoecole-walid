import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { ViewToggle } from "@/components/bilan/ViewToggle";
import { Icon } from "@/components/ui/Icon";
import { hoursLabel, isYear, monthName, summarizeYear, yearTotal } from "@/lib/bilan";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { utcToZoned, zonedTimeToUtc } from "@/lib/time";
import { btnSecondary, panel } from "@/lib/ui";
import { parseDateOnly } from "@/lib/validation";

/** The year view of the summary: one row per month. Shown by /admin/bilan?vue=annee. */
export async function YearView({ annee }: { annee?: string }) {
    const today = utcToZoned(new Date(), site.timeZone).date;
    const year = annee && isYear(annee) ? annee : today.slice(0, 4);
    const next = String(Number(year) + 1);

    const [lessons, payments] = await Promise.all([
        prisma.lesson.findMany({
            where: {
                startsAt: {
                    gte: zonedTimeToUtc(`${year}-01-01`, "00:00", site.timeZone),
                    lt: zonedTimeToUtc(`${next}-01-01`, "00:00", site.timeZone),
                },
            },
            select: { instructorId: true, carId: true, status: true, startsAt: true, endsAt: true, amount: true },
        }),
        prisma.payment.findMany({
            where: { voidedAt: null, paidOn: { gte: parseDateOnly(`${year}-01-01`)!, lt: parseDateOnly(`${next}-01-01`)! } },
            select: { amount: true, paidOn: true },
        }),
    ]);

    const rows = summarizeYear(
        year,
        lessons.map((lesson) => ({
            month: utcToZoned(lesson.startsAt, site.timeZone).date.slice(0, 7),
            instructorId: lesson.instructorId,
            carId: lesson.carId,
            status: lesson.status,
            minutes: Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60_000),
            amount: lesson.amount,
        })),
        payments.map((payment) => ({ month: payment.paidOn.toISOString().slice(0, 7), amount: payment.amount })),
    );
    const { tally, received } = yearTotal(rows);

    // Switching to the month view lands on this month when the year is the current one, else on January.
    const monthTarget = today.startsWith(year) ? today.slice(0, 7) : `${year}-01`;
    const best = Math.max(...rows.map((row) => row.tally.billed), 1);

    return (
        <>
            <PageHeader
                title="Bilan de l’année"
                description="Mois par mois : leçons données, heures, facturé et encaissé."
                actions={
                    <>
                        <ViewToggle active="year" monthHref={`/admin/bilan?mois=${monthTarget}`} yearHref={`/admin/bilan?vue=annee&annee=${year}`} />
                        <nav aria-label="Année" className="flex items-center gap-2">
                            <Link href={`/admin/bilan?vue=annee&annee=${Number(year) - 1}`} className={btnSecondary} aria-label="Année précédente">
                                <Icon name="chevronLeft" className="size-4" />
                            </Link>
                            <span className="min-w-16 text-center font-display text-lg font-semibold tabular-nums">{year}</span>
                            <Link href={`/admin/bilan?vue=annee&annee=${Number(year) + 1}`} className={btnSecondary} aria-label="Année suivante">
                                <Icon name="chevronRight" className="size-4" />
                            </Link>
                        </nav>
                    </>
                }
            />

            <div className="grid max-w-5xl gap-6">
                <section aria-label="Chiffres de l’année" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Figure label="Leçons effectuées" value={String(tally.done)} note={tally.absent ? `${tally.absent} absence${tally.absent > 1 ? "s" : ""}` : undefined} />
                    <Figure label="Heures données" value={hoursLabel(tally.minutes)} />
                    <Figure label="Facturé" value={formatMoney(tally.billed)} note={tally.unpriced ? `${tally.unpriced} leçon${tally.unpriced > 1 ? "s" : ""} sans prix` : undefined} />
                    <Figure label="Encaissé" value={formatMoney(received)} />
                </section>

                <div className={`${panel} overflow-x-auto`}>
                    <table className="w-full min-w-[40rem] text-sm">
                        <thead>
                            <tr className="border-b border-line text-left text-xs text-muted">
                                <th scope="col" className="px-5 py-3 font-medium">Mois</th>
                                <th scope="col" className="px-3 py-3 text-right font-medium">Leçons</th>
                                <th scope="col" className="px-3 py-3 text-right font-medium">Heures</th>
                                <th scope="col" className="px-3 py-3 text-right font-medium">Absences</th>
                                <th scope="col" className="px-3 py-3 text-right font-medium">Facturé</th>
                                <th scope="col" className="px-5 py-3 text-right font-medium">Encaissé</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {rows.map((row) => {
                                const empty = row.tally.done + row.tally.absent === 0 && row.received === 0;
                                return (
                                    <tr key={row.month} className={empty ? "text-muted" : ""}>
                                        <th scope="row" className="px-5 py-3 text-left font-medium">
                                            <Link href={`/admin/bilan?mois=${row.month}`} className="hover:text-brand hover:underline">
                                                {monthName(row.month, true)}
                                            </Link>
                                            {row.tally.billed > 0 && (
                                                <span
                                                    aria-hidden="true"
                                                    className="mt-1.5 block h-1 rounded-full bg-brand/60"
                                                    style={{ width: `${Math.max(4, (row.tally.billed / best) * 100)}%`, maxWidth: "8rem" }}
                                                />
                                            )}
                                        </th>
                                        <td className="px-3 py-3 text-right tabular-nums">{row.tally.done}</td>
                                        <td className="px-3 py-3 text-right tabular-nums">{hoursLabel(row.tally.minutes)}</td>
                                        <td className="px-3 py-3 text-right tabular-nums">{row.tally.absent}</td>
                                        <td className="px-3 py-3 text-right tabular-nums">{formatMoney(row.tally.billed)}</td>
                                        <td className="px-5 py-3 text-right tabular-nums">{formatMoney(row.received)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-line-strong font-semibold">
                                <th scope="row" className="px-5 py-3 text-left">Total {year}</th>
                                <td className="px-3 py-3 text-right tabular-nums">{tally.done}</td>
                                <td className="px-3 py-3 text-right tabular-nums">{hoursLabel(tally.minutes)}</td>
                                <td className="px-3 py-3 text-right tabular-nums">{tally.absent}</td>
                                <td className="px-3 py-3 text-right tabular-nums">{formatMoney(tally.billed)}</td>
                                <td className="px-5 py-3 text-right tabular-nums">{formatMoney(received)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <p className="text-sm text-muted">
                    Seules les leçons marquées « Effectuée » ou « Absent » comptent. L’encaissé suit la date de chaque paiement.
                </p>
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
