import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { DayAgenda } from "@/components/planning/DayAgenda";
import { kindStyles } from "@/components/planning/lessonStyles";
import { PlanningGrid, type GridColumn, type GridDay } from "@/components/planning/PlanningGrid";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/auth";
import { isUuid } from "@/lib/format";
import { KIND_LABELS, LESSON_KINDS } from "@/lib/lessons";
import { hourRange, layoutLanes, newLessonHref, planningHref, type PlannedLesson } from "@/lib/planning";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import {
    addDays,
    dayOfMonth,
    durationLabel,
    formatDayLong,
    formatWeekRange,
    isDateString,
    utcToZoned,
    weekStart,
    weekdayShort,
    zonedTimeToUtc,
} from "@/lib/time";
import { btnPrimary, btnSecondary, inputInline } from "@/lib/ui";

export const metadata: Metadata = { title: "Planning" };

type SearchParams = Promise<{
    semaine?: string;
    vue?: string;
    jour?: string;
    moniteur?: string;
    vehicule?: string;
    annulees?: string;
}>;

const chip = "inline-flex items-center px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand";

export default async function PlanningPage({ searchParams }: { searchParams: SearchParams }) {
    await requireAdmin();

    const params = await searchParams;
    const timeZone = site.timeZone;
    const today = utcToZoned(new Date(), timeZone).date;

    // Two views: the week (seven days) and the day (one column per instructor).
    const dayView = params.vue === "jour";
    const asked = dayView ? params.jour : params.semaine;
    const focus = asked && isDateString(asked) ? asked : today;
    const start = weekStart(focus);
    const day = focus;

    const instructorId = params.moniteur && isUuid(params.moniteur) ? params.moniteur : undefined;
    const carId = params.vehicule && isUuid(params.vehicule) ? params.vehicule : undefined;
    const showCancelled = params.annulees === "1";

    const firstDay = dayView ? day : start;
    const from = zonedTimeToUtc(firstDay, "00:00", timeZone);
    const to = zonedTimeToUtc(addDays(firstDay, dayView ? 1 : 7), "00:00", timeZone);

    const [rows, instructors, cars] = await Promise.all([
        prisma.lesson.findMany({
            where: {
                startsAt: { gte: from, lt: to },
                ...(instructorId ? { instructorId } : {}),
                ...(carId ? { carId } : {}),
                ...(showCancelled ? {} : { status: { not: "cancelled" as const } }),
            },
            orderBy: { startsAt: "asc" },
            select: {
                id: true,
                kind: true,
                status: true,
                startsAt: true,
                endsAt: true,
                instructorId: true,
                student: { select: { firstName: true, lastName: true } },
                instructor: { select: { firstName: true, lastName: true } },
                car: { select: { label: true } },
            },
        }),
        prisma.instructor.findMany({
            orderBy: [{ active: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
            select: { id: true, firstName: true, lastName: true, active: true },
        }),
        prisma.car.findMany({
            orderBy: [{ active: "desc" }, { label: "asc" }],
            select: { id: true, label: true },
        }),
    ]);

    // Each lesson as the clock at the school shows it. Lessons end before midnight, so a
    // lesson belongs to the day it starts.
    const planned: PlannedLesson[] = rows.map((row) => {
        const begin = utcToZoned(row.startsAt, timeZone);
        const length = Math.round((row.endsAt.getTime() - row.startsAt.getTime()) / 60_000);
        return {
            id: row.id,
            date: begin.date,
            startMin: begin.minutes,
            endMin: Math.min(1440, begin.minutes + length),
            kind: row.kind as PlannedLesson["kind"],
            status: row.status as PlannedLesson["status"],
            studentName: `${row.student.firstName} ${row.student.lastName}`,
            instructorId: row.instructorId,
            instructorName: `${row.instructor.firstName} ${row.instructor.lastName}`,
            carLabel: row.car?.label ?? null,
        };
    });

    const { startHour, endHour } = hourRange(planned);
    const counted = planned.filter((lesson) => lesson.status !== "cancelled");
    const totalMinutes = counted.reduce((sum, lesson) => sum + (lesson.endMin - lesson.startMin), 0);

    // Links keep the view, the date and the filters.
    const filters = { moniteur: instructorId, vehicule: carId, annulees: showCancelled };
    const hereWeek = (date: string) => planningHref({ semaine: date, ...filters });
    const hereDay = (date: string) => planningHref({ vue: "jour", jour: date, ...filters });
    const here = dayView ? hereDay : hereWeek;
    const todayInView = dayView ? today === day : today >= start && today < addDays(start, 7);
    const newHref = (date: string, moniteur = instructorId) => newLessonHref({ date, moniteur, vehicule: carId });

    // Week view: seven day columns. Day view: one column per instructor.
    const weekDays: GridDay[] = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(start, i);
        return { date, isToday: date === today, lessons: layoutLanes(planned.filter((l) => l.date === date)) };
    });
    const visibleInstructors = instructors.filter(
        (instructor) =>
            (instructorId ? instructor.id === instructorId : instructor.active) ||
            planned.some((lesson) => lesson.instructorId === instructor.id),
    );

    const columns: GridColumn[] = dayView
        ? visibleInstructors.map((instructor) => ({
            key: instructor.id,
            header: (
                <span className="flex items-center gap-2">
                    <Avatar id={instructor.id} firstName={instructor.firstName} lastName={instructor.lastName} />
                    <span className="truncate text-sm font-medium">
                        {instructor.firstName} {instructor.lastName}
                    </span>
                </span>
            ),
            addHref: newHref(day, instructor.id),
            addLabel: `Nouvelle leçon avec ${instructor.firstName} ${instructor.lastName}`,
            lessons: layoutLanes(planned.filter((lesson) => lesson.instructorId === instructor.id)),
        }))
        : weekDays.map((weekDay) => ({
            key: weekDay.date,
            header: (
                <p className="flex items-baseline gap-1.5">
                    <span className="text-xs text-muted capitalize">{weekdayShort(weekDay.date)}</span>
                    <span
                        className={`font-display text-base font-bold tabular-nums ${weekDay.isToday
                                ? "inline-flex size-7 items-center justify-center rounded-full bg-brand text-brand-contrast"
                                : ""
                            }`}
                    >
                        {dayOfMonth(weekDay.date)}
                    </span>
                </p>
            ),
            addHref: newHref(weekDay.date),
            addLabel: `Nouvelle leçon le ${formatDayLong(weekDay.date)}`,
            highlight: weekDay.isToday,
            lessons: weekDay.lessons,
        }));

    const agendaDays: GridDay[] = dayView
        ? [{ date: day, isToday: day === today, lessons: layoutLanes(planned) }]
        : weekDays;

    const title = dayView ? `${formatDayLong(day)} ${day.slice(0, 4)}` : formatWeekRange(start);
    const step = dayView ? 1 : 7;
    const previous = here(addDays(dayView ? day : start, -step));
    const next = here(addDays(dayView ? day : start, step));
    const noInstructors = dayView && columns.length === 0;
    const allHref = dayView
        ? planningHref({ vue: "jour", jour: day, vehicule: carId, annulees: showCancelled })
        : planningHref({ semaine: start, vehicule: carId, annulees: showCancelled });
    const period = dayView ? "ce jour" : "cette semaine";

    return (
        <>
            <PageHeader
                title="Planning"
                description={
                    counted.length === 0
                        ? `Aucune leçon ${period}`
                        : `${counted.length} leçon${counted.length > 1 ? "s" : ""} · ${durationLabel(totalMinutes)} au total ${period}`
                }
                actions={
                    <Link href={newHref(dayView ? day : todayInView ? today : start)} className={btnPrimary}>
                        <Icon name="plus" className="size-4" />
                        Nouvelle leçon
                    </Link>
                }
            />

            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                <div role="group" aria-label="Affichage" className="inline-flex rounded-lg border border-line-strong bg-surface p-0.5">
                    <Link
                        href={hereWeek(dayView ? day : start)}
                        aria-current={dayView ? undefined : "page"}
                        className={`${chip} rounded-md ${dayView ? "text-muted hover:text-foreground" : "bg-brand-soft text-brand-ink"}`}
                    >
                        Semaine
                    </Link>
                    <Link
                        href={hereDay(dayView ? day : todayInView ? today : start)}
                        aria-current={dayView ? "page" : undefined}
                        className={`${chip} rounded-md ${dayView ? "bg-brand-soft text-brand-ink" : "text-muted hover:text-foreground"}`}
                    >
                        Jour
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <Link href={previous} aria-label={dayView ? "Jour précédent" : "Semaine précédente"} className={`${btnSecondary} px-2.5`}>
                        <Icon name="chevronLeft" className="size-4" />
                    </Link>
                    <Link href={next} aria-label={dayView ? "Jour suivant" : "Semaine suivante"} className={`${btnSecondary} px-2.5`}>
                        <Icon name="chevronRight" className="size-4" />
                    </Link>
                    <h2 className="mx-1 font-display text-lg font-semibold tabular-nums">{title}</h2>
                    {!todayInView && (
                        <Link href={here(today)} className={btnSecondary}>
                            Aujourd’hui
                        </Link>
                    )}
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <nav aria-label="Filtrer par moniteur" className="-mx-1 overflow-x-auto px-1">
                    <ul className="flex gap-1.5">
                        <li className="shrink-0">
                            <Link
                                href={allHref}
                                aria-current={instructorId ? undefined : "page"}
                                className={`${chip} rounded-full ${instructorId ? "text-muted hover:bg-line/60 hover:text-foreground" : "bg-brand-soft text-brand-ink"}`}
                            >
                                Tous
                            </Link>
                        </li>
                        {instructors
                            .filter((instructor) => instructor.active || instructor.id === instructorId)
                            .map((instructor) => {
                                const active = instructor.id === instructorId;
                                const href = dayView
                                    ? planningHref({ vue: "jour", jour: day, moniteur: instructor.id, vehicule: carId, annulees: showCancelled })
                                    : planningHref({ semaine: start, moniteur: instructor.id, vehicule: carId, annulees: showCancelled });
                                return (
                                    <li key={instructor.id} className="shrink-0">
                                        <Link
                                            href={href}
                                            aria-current={active ? "page" : undefined}
                                            className={`${chip} rounded-full ${active ? "bg-brand-soft text-brand-ink" : "text-muted hover:bg-line/60 hover:text-foreground"}`}
                                        >
                                            {instructor.firstName}
                                        </Link>
                                    </li>
                                );
                            })}
                    </ul>
                </nav>

                <form role="search" className="flex flex-wrap items-center gap-2">
                    {dayView ? (
                        <>
                            <input type="hidden" name="vue" value="jour" />
                            <input type="hidden" name="jour" value={day} />
                        </>
                    ) : (
                        <input type="hidden" name="semaine" value={start} />
                    )}
                    {instructorId && <input type="hidden" name="moniteur" value={instructorId} />}
                    <label htmlFor="vehicule" className="sr-only">
                        Véhicule
                    </label>
                    <select id="vehicule" name="vehicule" defaultValue={carId ?? ""} className={inputInline}>
                        <option value="">Tous les véhicules</option>
                        {cars.map((car) => (
                            <option key={car.id} value={car.id}>
                                {car.label}
                            </option>
                        ))}
                    </select>
                    <label className="flex items-center gap-2 px-1 text-sm text-muted">
                        <input type="checkbox" name="annulees" value="1" defaultChecked={showCancelled} className="size-4 accent-brand" />
                        Annulées
                    </label>
                    <button type="submit" className={btnSecondary}>
                        Filtrer
                    </button>
                    {(carId || showCancelled) && (
                        <Link
                            href={dayView ? planningHref({ vue: "jour", jour: day, moniteur: instructorId }) : planningHref({ semaine: start, moniteur: instructorId })}
                            className="text-sm font-medium text-brand hover:underline"
                        >
                            Effacer
                        </Link>
                    )}
                </form>
            </div>

            <ul aria-label="Types de leçon" className="mb-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
                {LESSON_KINDS.map((kind) => (
                    <li key={kind} className="flex items-center gap-2">
                        <span aria-hidden="true" className={`size-2.5 rounded-full ${kindStyles[kind].dot}`} />
                        {KIND_LABELS[kind]}
                    </li>
                ))}
            </ul>

            {noInstructors ? (
                <div className="rounded-2xl border border-line bg-surface">
                    <EmptyState
                        icon="user"
                        action={
                            <Link href="/admin/moniteurs/nouveau" className={btnPrimary}>
                                Ajouter un moniteur
                            </Link>
                        }
                    >
                        La vue par jour montre une colonne par moniteur. Ajoutez d’abord un moniteur.
                    </EmptyState>
                </div>
            ) : (
                <PlanningGrid
                    columns={columns}
                    startHour={startHour}
                    endHour={endHour}
                    showInstructor={!dayView}
                    minColumnRem={dayView ? 11 : 0}
                />
            )}
            <DayAgenda days={agendaDays} newHref={(date) => newHref(date)} />
        </>
    );
}
