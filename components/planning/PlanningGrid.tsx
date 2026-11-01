import Link from "next/link";
import { kindStyles } from "@/components/planning/lessonStyles";
import { Icon } from "@/components/ui/Icon";
import { KIND_LABELS } from "@/lib/lessons";
import type { PlannedLesson, Positioned } from "@/lib/planning";
import { formatRange, formatTime } from "@/lib/time";

/** One day, for the phone agenda. */
export type GridDay = {
    date: string;
    isToday: boolean;
    lessons: Positioned<PlannedLesson>[];
};

/** One column of the grid: a day (week view) or an instructor (day view). */
export type GridColumn = {
    key: string;
    header: React.ReactNode;
    /** Where the "+" button of the column leads. */
    addHref: string;
    addLabel: string;
    highlight?: boolean;
    lessons: Positioned<PlannedLesson>[];
};

type Props = {
    columns: GridColumn[];
    startHour: number;
    endHour: number;
    /** Show the instructor's name in each block (not needed when each column is an instructor). */
    showInstructor: boolean;
    /** Narrowest a column may get, in rem. Beyond that the grid scrolls sideways. 0 = never scrolls. */
    minColumnRem?: number;
};

/** Height of one hour, in rem. The grid, the hour lines and the blocks all derive from it. */
const HOUR_REM = 3.5;
const AXIS_REM = 3.5;

const firstWord = (name: string) => name.split(" ")[0];

/** Hour rows and one column per day or instructor. A lesson is a block as tall as it lasts. Hidden on phones. */
export function PlanningGrid({ columns, startHour, endHour, showInstructor, minColumnRem = 0 }: Props) {
    const hours = endHour - startHour;
    const rangeMinutes = hours * 60;
    const hourLabels = Array.from({ length: hours }, (_, i) => startHour + i);
    const template = `${AXIS_REM}rem repeat(${columns.length}, minmax(${minColumnRem}rem, 1fr))`;
    const minWidth = minColumnRem > 0 ? `${AXIS_REM + columns.length * minColumnRem}rem` : undefined;

    return (
        <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface md:block">
            <div style={{ minWidth }}>
                <div className="grid border-b border-line bg-surface-2" style={{ gridTemplateColumns: template }}>
                    <div />
                    {columns.map((column) => (
                        <div key={column.key} className="flex items-center justify-between gap-2 border-l border-line px-2.5 py-2.5">
                            <div className="min-w-0">{column.header}</div>
                            <Link
                                href={column.addHref}
                                aria-label={column.addLabel}
                                className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-line/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
                            >
                                <Icon name="plus" className="size-4" />
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="grid" style={{ gridTemplateColumns: template }}>
                    <div className="relative" style={{ height: `${hours * HOUR_REM}rem` }} aria-hidden="true">
                        {hourLabels.map((hour, i) => (
                            <span
                                key={hour}
                                className={`absolute right-2 text-[11px] text-muted tabular-nums ${i === 0 ? "" : "-translate-y-1/2"}`}
                                style={{ top: `${i * HOUR_REM}rem` }}
                            >
                                {String(hour).padStart(2, "0")}:00
                            </span>
                        ))}
                    </div>

                    {columns.map((column) => (
                        <div
                            key={column.key}
                            className={`relative border-l border-line [background-image:linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] ${column.highlight ? "bg-brand-soft/30" : ""
                                }`}
                            style={{ height: `${hours * HOUR_REM}rem`, backgroundSize: `100% ${HOUR_REM}rem` }}
                        >
                            {column.lessons.map((lesson) => (
                                <Block
                                    key={lesson.id}
                                    lesson={lesson}
                                    startHour={startHour}
                                    rangeMinutes={rangeMinutes}
                                    showInstructor={showInstructor}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Block({
    lesson,
    startHour,
    rangeMinutes,
    showInstructor,
}: {
    lesson: Positioned<PlannedLesson>;
    startHour: number;
    rangeMinutes: number;
    showInstructor: boolean;
}) {
    const top = ((lesson.startMin - startHour * 60) / rangeMinutes) * 100;
    const height = ((lesson.endMin - lesson.startMin) / rangeMinutes) * 100;
    const width = 100 / lesson.lanes;
    const cancelled = lesson.status === "cancelled";

    // The more lessons sit side by side, the less each block can say. The full details are in
    // the tooltip and on the lesson page.
    const roomy = lesson.lanes === 1;
    const tight = lesson.lanes >= 3;
    const who = showInstructor ? (roomy ? lesson.instructorName : firstWord(lesson.instructorName)) : null;
    const second = [who, roomy ? lesson.carLabel : null].filter(Boolean).join(" · ");

    return (
        <Link
            href={`/admin/planning/${lesson.id}`}
            title={`${KIND_LABELS[lesson.kind]} · ${formatRange(lesson.startMin, lesson.endMin)} · ${lesson.studentName} · ${lesson.instructorName}${lesson.carLabel ? ` · ${lesson.carLabel}` : ""
                }`}
            className={`absolute flex flex-col overflow-hidden rounded-md border-l-4 py-1 text-xs leading-snug shadow-sm transition-shadow hover:z-10 hover:shadow-md focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-brand ${tight ? "px-1" : "px-1.5"
                } ${kindStyles[lesson.kind].block} ${cancelled ? "opacity-55" : ""}`}
            style={{
                top: `calc(${top}% + 1px)`,
                height: `calc(${height}% - 2px)`,
                left: `calc(${lesson.lane * width}% + 2px)`,
                width: `calc(${width}% - 4px)`,
            }}
        >
            {!tight && (
                <span className="flex items-center justify-between gap-1 font-medium tabular-nums">
                    <span className="truncate">
                        {roomy ? formatRange(lesson.startMin, lesson.endMin) : formatTime(lesson.startMin)}
                    </span>
                    {lesson.status === "completed" && <span aria-label="Effectuée">✓</span>}
                    {lesson.status === "no_show" && <span aria-label="Absent">✗</span>}
                </span>
            )}
            <span className={`truncate font-medium ${cancelled ? "line-through" : ""}`}>
                {tight ? firstWord(lesson.studentName) : lesson.studentName}
            </span>
            {!tight && second && <span className="truncate opacity-80">{second}</span>}
        </Link>
    );
}