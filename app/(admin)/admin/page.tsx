import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { ServicePill } from "@/components/cars/ServicePill";
import { kindStyles } from "@/components/planning/lessonStyles";
import { StatusPill, STATUS_DOT } from "@/components/students/StatusPill";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/auth";
import { SERVICE_SOON_DAYS, serviceState } from "@/lib/cars";
import { monthBounds } from "@/lib/bilan";
import { studentBalances } from "@/lib/finance";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { KIND_LABELS, type LessonKindValue } from "@/lib/lessons";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { formatRange, relativeDay, utcToZoned, zonedTimeToUtc } from "@/lib/time";
import { parseDateOnly } from "@/lib/validation";
import { STATUS_LABELS, STUDENT_STATUSES, type StudentStatusValue } from "@/lib/students";
import { btnPrimary, panel } from "@/lib/ui";

function today(): string {
    const text = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function AdminHomePage() {
    // The layout checks too, but layouts are not re-run on every navigation.
    await requireAdmin();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const serviceLimit = new Date();
    serviceLimit.setDate(serviceLimit.getDate() + SERVICE_SOON_DAYS);

    const schoolMonth = utcToZoned(new Date(), site.timeZone).date.slice(0, 7);
    const bounds = monthBounds(schoolMonth);

    const [grouped, newThisMonth, recent, instructorCount, carCount, carsToService, nextLessons, monthPayments, monthBilled, balances, pendingAccounts, newRequests] = await Promise.all([
        prisma.student.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.student.count({ where: { createdAt: { gte: monthStart }, status: { not: "archived" } } }),
        prisma.student.findMany({
            where: { status: { not: "archived" } },
            orderBy: { createdAt: "desc" },
            take: 6,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                licenceCategory: true,
                status: true,
                createdAt: true,
            },
        }),
        prisma.instructor.count({ where: { active: true } }),
        prisma.car.count({ where: { active: true } }),
        // Cars in service whose next service is overdue or due within the next 30 days.
        prisma.car.findMany({
            where: { active: true, nextServiceDate: { not: null, lte: serviceLimit } },
            orderBy: { nextServiceDate: "asc" },
            take: 4,
            select: { id: true, label: true, nextServiceDate: true },
        }),
        prisma.lesson.findMany({
            where: { startsAt: { gte: new Date() }, status: "scheduled" },
            orderBy: { startsAt: "asc" },
            take: 5,
            select: {
                id: true,
                kind: true,
                startsAt: true,
                endsAt: true,
                student: { select: { firstName: true, lastName: true } },
                instructor: { select: { firstName: true, lastName: true } },
                car: { select: { label: true } },
            },
        }),
        prisma.payment.aggregate({
            _sum: { amount: true },
            where: { voidedAt: null, paidOn: { gte: parseDateOnly(bounds.first)!, lt: parseDateOnly(bounds.next)! } },
        }),
        prisma.lesson.aggregate({
            _sum: { amount: true },
            where: {
                status: { in: ["completed", "no_show"] },
                startsAt: {
                    gte: zonedTimeToUtc(bounds.first, "00:00", site.timeZone),
                    lt: zonedTimeToUtc(bounds.next, "00:00", site.timeZone),
                },
            },
        }),
        studentBalances(),
        prisma.user.count({ where: { role: "user" } }),
        prisma.prospect.count({ where: { status: "received", archivedAt: null } }),
    ]);
    const owing = balances.filter((student) => student.balance > 0);
    const owingTotal = owing.reduce((sum, student) => sum + student.balance, 0);
    const todayAtSchool = utcToZoned(new Date(), site.timeZone).date;

    const counts = Object.fromEntries(STUDENT_STATUSES.map((status) => [status, 0])) as Record<
        StudentStatusValue,
        number
    >;
    for (const row of grouped) counts[row.status as StudentStatusValue] = row._count._all;
    const total = STUDENT_STATUSES.reduce((sum, status) => sum + counts[status], 0);

    const stats = [
        { label: "Élèves actifs", value: counts.active, dot: STATUS_DOT.active, href: "/admin/eleves?statut=active" },
        { label: "En pause", value: counts.paused, dot: STATUS_DOT.paused, href: "/admin/eleves?statut=paused" },
        { label: "Terminés", value: counts.completed, dot: STATUS_DOT.completed, href: "/admin/eleves?statut=completed" },
        { label: "Inscrits ce mois-ci", value: newThisMonth, dot: "bg-foreground/30", href: undefined },
    ];

    return (
        <>
            <PageHeader
                title="Bonjour"
                description={today()}
                actions={
                    <Link href="/admin/eleves/nouveau" className={btnPrimary}>
                        <Icon name="plus" className="size-4" />
                        Nouvel élève
                    </Link>
                }
            />

            {newRequests > 0 && (
                <Link
                    href="/admin/demandes"
                    className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-info-fg/30 bg-info-bg px-4 py-3 text-sm font-medium text-info-fg transition-opacity hover:opacity-90"
                >
                    <span>
                        {newRequests} nouvelle{newRequests > 1 ? "s" : ""} demande{newRequests > 1 ? "s" : ""} à rappeler
                    </span>
                    <span className="inline-flex items-center gap-1">
                        Voir
                        <Icon name="arrowRight" className="size-4" />
                    </span>
                </Link>
            )}

            {pendingAccounts > 0 && (
                <Link
                    href="/admin/comptes"
                    className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-warn-fg/30 bg-warn-bg px-4 py-3 text-sm font-medium text-warn-fg transition-opacity hover:opacity-90"
                >
                    <span>
                        {pendingAccounts} compte{pendingAccounts > 1 ? "s" : ""} en attente d’activation
                    </span>
                    <span className="inline-flex items-center gap-1">
                        Voir
                        <Icon name="arrowRight" className="size-4" />
                    </span>
                </Link>
            )}

            <section
                aria-label="Chiffres clés"
                className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4"
            >
                {stats.map((stat) => {
                    const body = (
                        <>
                            <p className="flex items-center gap-2 text-sm text-muted">
                                <span aria-hidden="true" className={`size-2 rounded-full ${stat.dot}`} />
                                {stat.label}
                            </p>
                            <p className="mt-3 font-display text-4xl font-bold tracking-tight tabular-nums">
                                {stat.value}
                            </p>
                        </>
                    );
                    return stat.href ? (
                        <Link
                            key={stat.label}
                            href={stat.href}
                            className="bg-surface p-5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
                        >
                            {body}
                        </Link>
                    ) : (
                        <div key={stat.label} className="bg-surface p-5">
                            {body}
                        </div>
                    );
                })}
            </section>

            <section
                aria-label="Argent du mois"
                className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3"
            >
                <Link href="/admin/bilan" className="bg-surface p-5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand">
                    <p className="text-sm text-muted">Encaissé ce mois-ci</p>
                    <p className="mt-3 font-display text-3xl font-bold tracking-tight tabular-nums">
                        {formatMoney(monthPayments._sum.amount ?? 0)}
                    </p>
                </Link>
                <Link href="/admin/bilan" className="bg-surface p-5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand">
                    <p className="text-sm text-muted">Facturé ce mois-ci</p>
                    <p className="mt-3 font-display text-3xl font-bold tracking-tight tabular-nums">
                        {formatMoney(monthBilled._sum.amount ?? 0)}
                    </p>
                </Link>
                <Link href="/admin/bilan" className="bg-surface p-5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand">
                    <p className="text-sm text-muted">
                        {owing.length} élève{owing.length > 1 ? "s" : ""} {owing.length > 1 ? "doivent" : "doit"} de l’argent
                    </p>
                    <p className="mt-3 font-display text-3xl font-bold tracking-tight text-warn-fg tabular-nums">
                        {formatMoney(owingTotal)}
                    </p>
                </Link>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="flex min-w-0 flex-col gap-6">
                    <section className={`${panel} min-w-0`}>
                        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
                            <h2 className="font-display text-lg font-semibold">Derniers inscrits</h2>
                            <Link href="/admin/eleves" className="text-sm font-medium text-brand hover:underline">
                                Voir tous les élèves
                            </Link>
                        </div>

                        {recent.length === 0 ? (
                            <p className="px-5 pb-6 text-sm text-muted">
                                Aucun élève pour l’instant. Ajoutez le premier avec « Nouvel élève ».
                            </p>
                        ) : (
                            <ul className="divide-y divide-line">
                                {recent.map((student) => (
                                    <li key={student.id}>
                                        <Link
                                            href={`/admin/eleves/${student.id}`}
                                            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
                                        >
                                            <Avatar id={student.id} firstName={student.firstName} lastName={student.lastName} />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium">
                                                    {student.firstName} {student.lastName}
                                                </span>
                                                <span className="block truncate text-xs text-muted">
                                                    Permis {student.licenceCategory} · inscrit le {formatDate(student.createdAt, "short")}
                                                </span>
                                            </span>
                                            <span className="hidden sm:block">
                                                <StatusPill status={student.status as StudentStatusValue} />
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className={`${panel} min-w-0`}>
                        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
                            <h2 className="font-display text-lg font-semibold">Prochaines leçons</h2>
                            <Link href="/admin/planning" className="text-sm font-medium text-brand hover:underline">
                                Voir le planning
                            </Link>
                        </div>

                        {nextLessons.length === 0 ? (
                            <div className="mx-5 mb-5 flex items-start gap-3 rounded-xl bg-surface-2 p-4">
                                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
                                    <Icon name="calendar" className="size-5" />
                                </span>
                                <p className="text-sm text-muted">
                                    Aucune leçon à venir. Planifiez la première avec « Nouvelle leçon » dans le planning.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-line">
                                {nextLessons.map((lesson) => {
                                    const begin = utcToZoned(lesson.startsAt, site.timeZone);
                                    const length = Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60_000);
                                    return (
                                        <li key={lesson.id}>
                                            <Link
                                                href={`/admin/planning/${lesson.id}`}
                                                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`h-10 w-1.5 shrink-0 rounded-full ${kindStyles[lesson.kind as LessonKindValue].dot}`}
                                                />
                                                <span className="w-28 shrink-0 sm:w-32">
                                                    <span className="block text-sm font-medium capitalize">
                                                        {relativeDay(begin.date, todayAtSchool)}
                                                    </span>
                                                    <span className="block text-xs text-muted tabular-nums">
                                                        {formatRange(begin.minutes, begin.minutes + length)}
                                                    </span>
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-medium">
                                                        {lesson.student.firstName} {lesson.student.lastName}
                                                    </span>
                                                    <span className="block truncate text-xs text-muted">
                                                        {KIND_LABELS[lesson.kind as LessonKindValue]} · {lesson.instructor.firstName}
                                                        {lesson.car ? ` · ${lesson.car.label}` : ""}
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>

                <div className="flex min-w-0 flex-col gap-6">
                    <section className={`${panel} p-5`}>
                        <h2 className="font-display text-lg font-semibold">Répartition</h2>
                        <p className="mt-0.5 text-sm text-muted tabular-nums">
                            {total} élève{total > 1 ? "s" : ""} au total
                        </p>

                        {total > 0 && (
                            <div
                                role="img"
                                aria-label="Répartition des élèves par statut"
                                className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full"
                            >
                                {STUDENT_STATUSES.filter((status) => counts[status] > 0).map((status) => (
                                    <span
                                        key={status}
                                        className={STATUS_DOT[status]}
                                        style={{ width: `${(counts[status] / total) * 100}%` }}
                                    />
                                ))}
                            </div>
                        )}

                        <ul className="mt-4 space-y-2.5">
                            {STUDENT_STATUSES.map((status) => (
                                <li key={status} className="flex items-center gap-2.5 text-sm">
                                    <span aria-hidden="true" className={`size-2.5 rounded-full ${STATUS_DOT[status]}`} />
                                    <span className="flex-1">{STATUS_LABELS[status]}</span>
                                    <span className="font-medium tabular-nums">{counts[status]}</span>
                                    <span className="w-10 text-right text-muted tabular-nums">
                                        {total > 0 ? Math.round((counts[status] / total) * 100) : 0} %
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className={`${panel} p-5`}>
                        <h2 className="font-display text-lg font-semibold">Équipe et véhicules</h2>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <Link
                                href="/admin/moniteurs"
                                className="rounded-xl bg-surface-2 p-3.5 transition-colors hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-brand"
                            >
                                <p className="flex items-center gap-2 text-sm text-muted">
                                    <Icon name="user" className="size-4" />
                                    Moniteurs
                                </p>
                                <p className="mt-1.5 font-display text-2xl font-bold tabular-nums">{instructorCount}</p>
                            </Link>
                            <Link
                                href="/admin/vehicules"
                                className="rounded-xl bg-surface-2 p-3.5 transition-colors hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-brand"
                            >
                                <p className="flex items-center gap-2 text-sm text-muted">
                                    <Icon name="car" className="size-4" />
                                    Véhicules
                                </p>
                                <p className="mt-1.5 font-display text-2xl font-bold tabular-nums">{carCount}</p>
                            </Link>
                        </div>

                        <h3 className="mt-5 text-sm font-medium">Entretien à prévoir</h3>
                        {carsToService.length === 0 ? (
                            <p className="mt-2 text-sm text-muted">
                                {carCount === 0
                                    ? "Ajoutez vos véhicules pour suivre leur entretien."
                                    : "Rien à signaler pour les 30 prochains jours."}
                            </p>
                        ) : (
                            <ul className="mt-2 divide-y divide-line">
                                {carsToService.map((car) => (
                                    <li key={car.id}>
                                        <Link
                                            href={`/admin/vehicules/${car.id}`}
                                            className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand"
                                        >
                                            <span className="min-w-0 truncate font-medium">{car.label}</span>
                                            <ServicePill info={serviceState(car.nextServiceDate)} />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
