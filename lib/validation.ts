// Checks shared by the student, instructor and car forms. No imports.

export function isPhone(value: string): boolean {
    return /^[0-9+()\s.-]{6,20}$/.test(value);
}

export function isEmail(value: string): boolean {
    return value.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** "2026-10-31" becomes a Date. Anything else, including 2026-02-31, gives null. */
export function parseDateOnly(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
    return date;
}
