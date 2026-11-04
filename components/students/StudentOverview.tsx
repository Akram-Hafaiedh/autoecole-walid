import Link from "next/link";
import { KIND_LABELS } from "@/lib/lessons";
import { formatMoney } from "@/lib/money";
import { hoursLabel } from "@/lib/bilan";
import type { ProfileLesson, ProfileStats } from "@/lib/profile";
import { site } from "@/lib/site";
import { formatDayShort, formatTime, utcToZoned } from "@/lib/time";
import { panel } from "@/lib/ui";

type Props = {
    studentId: string;
    stats: ProfileStats;
    /** Positive: the student owes this. Negative: paid too much. */
    balance: number;
    nextInstructor: string | null;
};

/** The numbers at the top of a student's page. */
export function StudentOverview({ studentId, stats, balance, nextInstructor }: Props) {
    const next: ProfileLesson | null = stats.next;
    const start = next ? utcToZoned(next.startsAt, site.timeZone) : null;
    const owes = balance > 0;

    return (
        <section aria-label="Résumé de l’élève" className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card label="Conduite effectuée" value={hoursLabel(stats.drivingMinutes)} note={`${stats.drivingDone} leçon${stats.drivingDone > 1 ? "s" : ""}`} />
            <Card
                label="Code effectué"
                value={`${stats.codeDone} séance${stats.codeDone > 1 ? "s" : ""}`}
                note={stats.absences ? `${stats.absences} absence${stats.absences > 1 ? "s" : ""}` : undefined}
            />
            <Card
                label="Prochaine leçon"
                value={start && next ? formatDayShort(start.date) : "Aucune"}
                note={
                    start && next
                        ? `${formatTime(start.minutes)} · ${KIND_LABELS[next.kind]}${nextInstructor ? ` · ${nextInstructor}` : ""}`
                        : "Rien de planifié"
                }
                href={next ? `/admin/planning/${next.id}` : undefined}
            />
            <Card
                label={owes ? "Reste à payer" : balance < 0 ? "Payé en trop" : "Solde"}
                value={formatMoney(Math.abs(balance))}
                note="Voir les paiements"
                href={`/admin/eleves/${studentId}/paiements`}
                tone={owes ? "text-warn-fg" : balance === 0 ? "text-ok-fg" : "text-info-fg"}
            />
        </section>
    );
}

function Card({ label, value, note, href, tone }: { label: string; value: string; note?: string; href?: string; tone?: string }) {
    const body = (
        <>
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone ?? ""}`}>{value}</p>
            {note && <p className="mt-1 truncate text-xs text-muted">{note}</p>}
        </>
    );
    return href ? (
        <Link href={href} className={`${panel} block p-4 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-brand`}>
            {body}
        </Link>
    ) : (
        <div className={`${panel} p-4`}>{body}</div>
    );
}
