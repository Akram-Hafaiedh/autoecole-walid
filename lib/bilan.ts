// The monthly summary: what was taught and what came in, per instructor and per car. Pure
// functions with no database, so every rule can be tested on its own.
//
// Hours are the lessons marked done. Billed is what done and absent lessons were billed (the
// frozen amount). Received is what was paid, by payment date, whatever month the lessons were in.


/** "2026-11" */
export function isMonth(value: string): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function addMonths(month: string, count: number): string {
    const [year, m] = month.split("-").map(Number);
    const index = year * 12 + (m - 1) + count;
    return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** The first day of the month and of the next one, as "2026-11-01" and "2026-12-01". */
export function monthBounds(month: string): { first: string; next: string } {
    return { first: `${month}-01`, next: `${addMonths(month, 1)}-01` };
}

/** "novembre 2026" */
export function monthLabel(month: string): string {
    return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${month}-01T00:00:00Z`),
    );
}

export type MonthLesson = {
    /** The instructor or car this lesson belongs to. */
    instructorId: string;
    carId: string | null;
    status: "scheduled" | "completed" | "cancelled" | "no_show";
    minutes: number;
    amount: number | null;
};

export type Tally = {
    /** Lessons marked done. */
    done: number;
    /** Minutes of lessons marked done. */
    minutes: number;
    absent: number;
    cancelled: number;
    /** Planned and not yet marked. */
    planned: number;
    /** What done and absent lessons were billed. */
    billed: number;
    /** Done or absent lessons that have no price yet. */
    unpriced: number;
};

export const emptyTally = (): Tally => ({ done: 0, minutes: 0, absent: 0, cancelled: 0, planned: 0, billed: 0, unpriced: 0 });

function add(tally: Tally, lesson: MonthLesson): void {
    if (lesson.status === "completed") {
        tally.done += 1;
        tally.minutes += lesson.minutes;
    } else if (lesson.status === "no_show") tally.absent += 1;
    else if (lesson.status === "cancelled") tally.cancelled += 1;
    else tally.planned += 1;

    if (lesson.status === "completed" || lesson.status === "no_show") {
        if (lesson.amount === null) tally.unpriced += 1;
        else tally.billed += lesson.amount;
    }
}

export type MonthSummary = {
    total: Tally;
    byInstructor: Map<string, Tally>;
    /** Lessons without a car (a code lesson, for example) are under the key null. */
    byCar: Map<string | null, Tally>;
    /** Received this month, in millimes. */
    received: number;
};

export function summarizeMonth(lessons: MonthLesson[], payments: number[]): MonthSummary {
    const total = emptyTally();
    const byInstructor = new Map<string, Tally>();
    const byCar = new Map<string | null, Tally>();

    for (const lesson of lessons) {
        add(total, lesson);
        add(byInstructor.get(lesson.instructorId) ?? byInstructor.set(lesson.instructorId, emptyTally()).get(lesson.instructorId)!, lesson);
        add(byCar.get(lesson.carId) ?? byCar.set(lesson.carId, emptyTally()).get(lesson.carId)!, lesson);
    }
    return { total, byInstructor, byCar, received: payments.reduce((sum, amount) => sum + amount, 0) };
}

/** Hours with a decimal, for totals: 90 minutes is "1,5 h". */
export function hoursLabel(minutes: number): string {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${String(hours).replace(".", ",")} h`;
}

// ---- The year view ---------------------------------------------------------------------

/** "2026" */
export function isYear(value: string): boolean {
    return /^20\d{2}$/.test(value);
}

export type YearRow = { month: string; tally: Tally; received: number };

/**
 * One row per month of `year`. Lessons and payments come with the month they belong to
 * ("2026-11"); anything outside the year is ignored.
 */
export function summarizeYear(
    year: string,
    lessons: (MonthLesson & { month: string })[],
    payments: { month: string; amount: number }[],
): YearRow[] {
    const rows: YearRow[] = Array.from({ length: 12 }, (_, i) => ({
        month: `${year}-${String(i + 1).padStart(2, "0")}`,
        tally: emptyTally(),
        received: 0,
    }));
    const byMonth = new Map(rows.map((row) => [row.month, row]));
    for (const lesson of lessons) {
        const row = byMonth.get(lesson.month);
        if (row) add(row.tally, lesson);
    }
    for (const payment of payments) {
        const row = byMonth.get(payment.month);
        if (row) row.received += payment.amount;
    }
    return rows;
}

/** The totals of the whole year, from its twelve rows. */
export function yearTotal(rows: YearRow[]): { tally: Tally; received: number } {
    const tally = emptyTally();
    let received = 0;
    for (const row of rows) {
        for (const key of Object.keys(tally) as (keyof Tally)[]) tally[key] += row.tally[key];
        received += row.received;
    }
    return { tally, received };
}

/** "nov." for the month "2026-11", or the full name with `long`. */
export function monthName(month: string, long = false): string {
    const name = new Intl.DateTimeFormat("fr-FR", { month: long ? "long" : "short", timeZone: "UTC" }).format(
        new Date(`${month}-01T00:00:00Z`),
    );
    return name.charAt(0).toUpperCase() + name.slice(1);
}
