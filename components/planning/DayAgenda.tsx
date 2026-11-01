import Link from "next/link";
import { kindStyles } from "@/components/planning/lessonStyles";
import type { GridDay } from "@/components/planning/PlanningGrid";
import { Icon } from "@/components/ui/Icon";
import { KIND_LABELS, LESSON_STATUS_LABELS } from "@/lib/lessons";
import { durationLabel, formatDayLong, formatRange } from "@/lib/time";

type Props = {
    days: GridDay[];
    newHref: (date: string) => string;
};

/** The week as a list of days, for phones where seven columns do not fit. */
export function DayAgenda({ days, newHref }: Props) {
    return (
        <div className="flex flex-col gap-4 md:hidden">
            {days.map((day) => {
                const lessons = [...day.lessons].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
                return (
                    <section key={day.date} aria-label={formatDayLong(day.date)}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <h2
                                className={`font-display text-base font-semibold ${day.isToday ? "text-brand" : ""}`}
                            >
                                {formatDayLong(day.date)}
                                {day.isToday && (
                                    <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 align-middle text-xs font-medium text-brand-ink">
                                        Aujourd’hui
                                    </span>
                                )}
                            </h2>
                            <Link
                                href={newHref(day.date)}
                                aria-label={`Nouvelle leçon le ${formatDayLong(day.date)}`}
                                className="rounded-md p-1.5 text-muted transition-colors hover:bg-line/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
                            >
                                <Icon name="plus" className="size-5" />
                            </Link>
                        </div>

                        {lessons.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">
                                Aucune leçon
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {lessons.map((lesson) => {
                                    const cancelled = lesson.status === "cancelled";
                                    return (
                                        <li key={lesson.id}>
                                            <Link
                                                href={`/admin/planning/${lesson.id}`}
                                                className={`flex gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-brand ${cancelled ? "opacity-60" : ""
                                                    }`}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`w-1.5 shrink-0 rounded-full ${kindStyles[lesson.kind].dot}`}
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-baseline justify-between gap-2">
                                                        <span className="font-medium tabular-nums">
                                                            {formatRange(lesson.startMin, lesson.endMin)}
                                                        </span>
                                                        <span className="text-xs text-muted">
                                                            {durationLabel(lesson.endMin - lesson.startMin)}
                                                        </span>
                                                    </span>
                                                    <span
                                                        className={`mt-0.5 block truncate text-sm font-medium ${cancelled ? "line-through" : ""
                                                            }`}
                                                    >
                                                        {lesson.studentName}
                                                    </span>
                                                    <span className="mt-0.5 block truncate text-xs text-muted">
                                                        {KIND_LABELS[lesson.kind]} · {lesson.instructorName}
                                                        {lesson.carLabel ? ` · ${lesson.carLabel}` : ""}
                                                        {lesson.status !== "scheduled"
                                                            ? ` · ${LESSON_STATUS_LABELS[lesson.status]}`
                                                            : ""}
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
