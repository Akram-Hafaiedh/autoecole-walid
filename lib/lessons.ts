// Lesson form validation, labels and conflict messages. Only imports other pure helpers,
// so it can be tested on its own.
//
// A lesson has no fixed slot: it starts at any time and lasts anything from 15 minutes to
// 12 hours (a 1 h lesson and an 8 h day are the same kind of record). It must end before
// midnight, so every lesson belongs to one day of the planning.

import { PRICE_MODES, type PriceMode } from "@/lib/billing";
import { isUuid } from "@/lib/format";
import { readFields, type FormState } from "@/lib/form";
import { parseMoney } from "@/lib/money";
import { parseTime, zonedTimeToUtc } from "@/lib/time";
import { parseDateOnly } from "@/lib/validation";

export const LESSON_KINDS = ["driving", "code", "exam"] as const;
export type LessonKindValue = (typeof LESSON_KINDS)[number];

export const KIND_LABELS: Record<LessonKindValue, string> = {
    driving: "Conduite",
    code: "Code",
    exam: "Examen",
};

export const LESSON_STATUSES = ["scheduled", "completed", "cancelled", "no_show"] as const;
export type LessonStatusValue = (typeof LESSON_STATUSES)[number];

export const LESSON_STATUS_LABELS: Record<LessonStatusValue, string> = {
    scheduled: "Planifiée",
    completed: "Effectuée",
    cancelled: "Annulée",
    no_show: "Absent",
};

/** One-tap durations in the form, in minutes. Any other length can be typed. */
export const DURATION_PRESETS = [60, 90, 120, 180, 240, 480] as const;
export const MIN_DURATION = 15;
export const MAX_DURATION = 720;

const MINUTES_PER_DAY = 1440;

export type LessonField =
    | "studentId"
    | "instructorId"
    | "carId"
    | "kind"
    | "status"
    | "date"
    | "time"
    | "duration"
    | "priceMode"
    | "price"
    | "notes";

export type LessonFormState = FormState<LessonField>;

export const LESSON_FIELDS: readonly LessonField[] = [
    "studentId",
    "instructorId",
    "carId",
    "kind",
    "status",
    "date",
    "time",
    "duration",
    "priceMode",
    "price",
    "notes",
];

export type LessonInput = {
    studentId: string;
    instructorId: string;
    carId: string | null;
    kind: LessonKindValue;
    status: LessonStatusValue;
    startsAt: Date;
    endsAt: Date;
    /** A price set on this one lesson (both set, or both null). Millimes, per session or per hour. */
    customPriceMode: PriceMode | null;
    customPrice: number | null;
    notes: string | null;
};

export type LessonParseResult =
    | { ok: true; data: LessonInput; date: string }
    | { ok: false; errors: NonNullable<LessonFormState["errors"]>; values: NonNullable<LessonFormState["values"]> };

/** The minute of the day when a lesson ends, or null when the time or duration is not valid. */
export function endMinutes(time: string, duration: string): number | null {
    const start = parseTime(time);
    if (start === null || !/^\d+$/.test(duration)) return null;
    const minutes = Number(duration);
    if (minutes < MIN_DURATION || minutes > MAX_DURATION) return null;
    return start + minutes;
}

export function parseLessonForm(formData: FormData, timeZone: string): LessonParseResult {
    const v = readFields(formData, LESSON_FIELDS);
    const errors: NonNullable<LessonFormState["errors"]> = {};

    if (!isUuid(v.studentId)) errors.studentId = "Choisissez un élève.";
    if (!isUuid(v.instructorId)) errors.instructorId = "Choisissez un moniteur.";

    const kindOk = (LESSON_KINDS as readonly string[]).includes(v.kind);
    if (!kindOk) errors.kind = "Choisissez un type de leçon.";

    // A code lesson never has a car. A driving lesson always does. An exam may have one.
    let carId: string | null = null;
    if (kindOk && v.kind !== "code") {
        if (v.carId && !isUuid(v.carId)) errors.carId = "Véhicule invalide.";
        else if (v.carId) carId = v.carId;
        else if (v.kind === "driving") errors.carId = "Choisissez un véhicule pour une leçon de conduite.";
    }

    const status = v.status || "scheduled";
    if (!(LESSON_STATUSES as readonly string[]).includes(status)) errors.status = "Statut invalide.";

    const date = parseDateOnly(v.date);
    if (!date) errors.date = "Date invalide.";
    else if (date.getUTCFullYear() < 2000 || date.getUTCFullYear() > 2100) errors.date = "Date impossible.";

    const startMinutes = parseTime(v.time);
    if (startMinutes === null) errors.time = "Heure invalide (par exemple 08:30).";

    if (!/^\d+$/.test(v.duration)) {
        errors.duration = "Indiquez la durée en minutes.";
    } else {
        const minutes = Number(v.duration);
        if (minutes < MIN_DURATION || minutes > MAX_DURATION) {
            errors.duration = `La durée doit être entre ${MIN_DURATION} minutes et ${MAX_DURATION / 60} heures.`;
        } else if (startMinutes !== null && startMinutes + minutes > MINUTES_PER_DAY) {
            errors.duration = "La leçon doit se terminer avant minuit. Raccourcissez-la ou avancez l’heure de début.";
        }
    }

    // An empty price type means "use the usual price".
    let customPriceMode: PriceMode | null = null;
    let customPrice: number | null = null;
    if (v.priceMode !== "") {
        if (!(PRICE_MODES as readonly string[]).includes(v.priceMode)) {
            errors.priceMode = "Type de prix invalide.";
        } else {
            customPriceMode = v.priceMode as PriceMode;
            customPrice = parseMoney(v.price);
            if (customPrice === null) errors.price = "Indiquez le prix (par exemple 25 ou 12,5).";
        }
    }

    if (v.notes.length > 2000) errors.notes = "2000 caractères au maximum.";

    if (Object.keys(errors).length > 0) return { ok: false, errors, values: v };

    const startsAt = zonedTimeToUtc(v.date, v.time, timeZone);
    return {
        ok: true,
        date: v.date,
        data: {
            studentId: v.studentId,
            instructorId: v.instructorId,
            carId,
            kind: v.kind as LessonKindValue,
            status: status as LessonStatusValue,
            startsAt,
            endsAt: new Date(startsAt.getTime() + Number(v.duration) * 60_000),
            customPriceMode,
            customPrice,
            notes: v.notes || null,
        },
    };
}

export type ConflictField = "instructorId" | "carId" | "studentId";

/** What each double booking is called in the messages. */
export const CONFLICT_SUBJECT: Record<ConflictField, string> = {
    instructorId: "Ce moniteur",
    carId: "Ce véhicule",
    studentId: "Cet élève",
};

const CONSTRAINT_FIELD: Record<string, ConflictField> = {
    lessons_no_instructor_overlap: "instructorId",
    lessons_no_car_overlap: "carId",
    lessons_no_student_overlap: "studentId",
};

/** Every piece of text inside an error, however deeply the driver nests it. */
function errorText(value: unknown, depth = 0, seen = new Set<unknown>()): string {
    if (typeof value === "string") return value;
    if (value === null || typeof value !== "object" || depth > 6 || seen.has(value)) return "";
    seen.add(value);
    const parts: string[] = [];
    for (const key of Object.getOwnPropertyNames(value)) {
        try {
            parts.push(errorText((value as Record<string, unknown>)[key], depth + 1, seen));
        } catch {
            // A getter that throws is skipped.
        }
    }
    return parts.join(" ");
}

/**
 * Which resource a database "overlapping lessons" error is about, or null when the error is
 * something else. Looks for the constraint name anywhere in the error, so it works however
 * the driver wraps it.
 */
export function conflictField(error: unknown): ConflictField | null {
    const text = errorText(error);
    for (const [name, field] of Object.entries(CONSTRAINT_FIELD)) {
        if (text.includes(name)) return field;
    }
    return null;
}
