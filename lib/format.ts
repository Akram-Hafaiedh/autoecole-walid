// Small formatting helpers shared by every admin screen. No imports, so they run on the
// server and in the browser, and can be tested on their own.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
    return UUID.test(value);
}

/** A date from the database as "2026-10-31", the format <input type="date"> expects. */
export function toDateInput(date: Date | null): string {
    return date ? date.toISOString().slice(0, 10) : "";
}

/** "Sami Ben Ali" becomes "SB". Falls back to "?" for empty names. */
export function initials(firstName: string, lastName: string): string {
    const first = firstName.trim().charAt(0);
    const last = lastName.trim().charAt(0);
    return (first + last).toUpperCase() || "?";
}

/** A stable number from 0 to count - 1, derived from the id. Used to pick an avatar colour. */
export function toneIndex(id: string, count: number): number {
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum = (sum * 31 + id.charCodeAt(i)) % 100_003;
    return sum % count;
}

/** French date, for example "12 septembre 2026" (long) or "12 sept. 2026" (short). */
export function formatDate(date: Date, style: "long" | "short" = "long"): string {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: style === "long" ? "long" : "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(date);
}
