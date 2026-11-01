// Dates and times in the school's time zone (site.timeZone). A lesson is stored as an exact
// instant (UTC) and shown as the local clock time at the school, wherever the server or the
// browser is. No imports, so it can be tested on its own.
//
// A "date" here is always the text "2026-10-31". A time of day is "HH:MM" or a number of
// minutes since midnight.

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-10-31" is a real calendar date (2026-02-31 is not). */
export function isDateString(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** "09:30" becomes 570. Anything that is not a valid 24-hour time gives null. */
export function parseTime(value: string): number | null {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** 570 becomes "09:30". */
export function formatTime(minutes: number): string {
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function formatRange(startMinutes: number, endMinutes: number): string {
    return `${formatTime(startMinutes)} – ${formatTime(endMinutes)}`;
}

/** 45 becomes "45 min", 60 "1 h", 90 "1 h 30", 480 "8 h". */
export function durationLabel(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours} h` : `${hours} h ${pad(rest)}`;
}

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

const formatters = new Map<string, Intl.DateTimeFormat>();

function partsIn(at: Date, timeZone: string): Parts {
    let formatter = formatters.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone,
            hourCycle: "h23",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        formatters.set(timeZone, formatter);
    }
    const out: Record<string, number> = {};
    for (const part of formatter.formatToParts(at)) {
        if (part.type !== "literal") out[part.type] = Number(part.value);
    }
    return out as Parts;
}

/** How many minutes the zone is ahead of UTC at that moment (Tunisia: 60). */
function offsetMinutes(at: Date, timeZone: string): number {
    const whole = Math.floor(at.getTime() / 60_000) * 60_000;
    const p = partsIn(new Date(whole), timeZone);
    return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - whole) / 60_000;
}

/** The instant when the clock at the school reads `date` `time`. */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const wall = Date.UTC(year, month - 1, day, hour, minute);
    // Two passes, so the hour around a clock change still lands on the right instant.
    let guess = wall - offsetMinutes(new Date(wall), timeZone) * 60_000;
    guess = wall - offsetMinutes(new Date(guess), timeZone) * 60_000;
    return new Date(guess);
}

/** Monday is 0, Sunday is 6. */
export function weekdayOf(date: string): number {
    return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export type ZonedMoment = { date: string; minutes: number; weekday: number };

/** What the clock and calendar at the school show at this instant. */
export function utcToZoned(at: Date, timeZone: string): ZonedMoment {
    const p = partsIn(at, timeZone);
    const date = `${p.year}-${pad(p.month)}-${pad(p.day)}`;
    return { date, minutes: p.hour * 60 + p.minute, weekday: weekdayOf(date) };
}

export function addDays(date: string, days: number): string {
    return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** The Monday of the week that contains this date. */
export function weekStart(date: string): string {
    return addDays(date, -weekdayOf(date));
}

function format(date: string, options: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

/** "lun." */
export function weekdayShort(date: string): string {
    return format(date, { weekday: "short" });
}

/** 31 */
export function dayOfMonth(date: string): number {
    return Number(date.slice(8, 10));
}

/** "samedi 31 octobre" */
export function formatDayLong(date: string): string {
    const text = format(date, { weekday: "long", day: "numeric", month: "long" });
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "sam. 31 oct." */
export function formatDayShort(date: string): string {
    return format(date, { weekday: "short", day: "numeric", month: "short" });
}

/** "26 oct. – 1 nov. 2026" for the week that starts on `start`. */
export function formatWeekRange(start: string): string {
    const end = addDays(start, 6);
    const sameYear = start.slice(0, 4) === end.slice(0, 4);
    const from = format(start, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
    const to = format(end, { day: "numeric", month: "short", year: "numeric" });
    return `${from} – ${to}`;
}

/** "Aujourd’hui", "Demain", otherwise "sam. 7 nov.". */
export function relativeDay(date: string, today: string): string {
    if (date === today) return "Aujourd’hui";
    if (date === addDays(today, 1)) return "Demain";
    return formatDayShort(date);
}
