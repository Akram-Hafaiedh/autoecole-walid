// Car form validation, labels and the service-date logic. Only imports other pure helpers,
// so it can be tested on its own.

import { readFields, type FormState } from "@/lib/form";
import { parseDateOnly } from "@/lib/validation";

export const TRANSMISSIONS = ["manual", "automatic"] as const;
export type TransmissionValue = (typeof TRANSMISSIONS)[number];

export const TRANSMISSION_LABELS: Record<TransmissionValue, string> = {
    manual: "Manuelle",
    automatic: "Automatique",
};

export const CAR_STATUSES = ["active", "inactive"] as const;
export type CarStatusValue = (typeof CAR_STATUSES)[number];

export const CAR_STATUS_LABELS: Record<CarStatusValue, string> = {
    active: "En service",
    inactive: "Hors service",
};

/** A service due within this many days is flagged as "bientôt". */
export const SERVICE_SOON_DAYS = 30;

export type CarField = "label" | "plate" | "transmission" | "status" | "nextServiceDate" | "notes";
export type CarFormState = FormState<CarField>;

export type CarInput = {
    label: string;
    plate: string;
    transmission: TransmissionValue;
    active: boolean;
    nextServiceDate: Date | null;
    notes: string | null;
};

export type CarParseResult =
    | { ok: true; data: CarInput }
    | { ok: false; errors: NonNullable<CarFormState["errors"]>; values: NonNullable<CarFormState["values"]> };

export const CAR_FIELDS: readonly CarField[] = ["label", "plate", "transmission", "status", "nextServiceDate", "notes"];

/** Trims, collapses repeated spaces and upper-cases, so "123  tun 4567" and "123 TUN 4567" match. */
export function normalizePlate(value: string): string {
    return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function parseCarForm(formData: FormData): CarParseResult {
    const v = readFields(formData, CAR_FIELDS);
    v.plate = normalizePlate(v.plate);
    const errors: NonNullable<CarFormState["errors"]> = {};

    if (!v.label) errors.label = "Le nom du véhicule est obligatoire.";
    else if (v.label.length > 60) errors.label = "60 caractères au maximum.";

    if (!v.plate) errors.plate = "L’immatriculation est obligatoire.";
    else if (!/^[\p{L}\p{N} -]{3,20}$/u.test(v.plate)) {
        errors.plate = "Immatriculation invalide (3 à 20 lettres, chiffres, espaces ou tirets).";
    }

    if (!(TRANSMISSIONS as readonly string[]).includes(v.transmission)) errors.transmission = "Boîte invalide.";
    if (!(CAR_STATUSES as readonly string[]).includes(v.status)) errors.status = "Statut invalide.";

    let nextServiceDate: Date | null = null;
    if (v.nextServiceDate) {
        const parsed = parseDateOnly(v.nextServiceDate);
        if (!parsed) errors.nextServiceDate = "Date invalide.";
        else if (parsed.getUTCFullYear() < 2000 || parsed.getUTCFullYear() > 2100) {
            errors.nextServiceDate = "Date impossible.";
        } else nextServiceDate = parsed;
    }

    if (v.notes.length > 2000) errors.notes = "2000 caractères au maximum.";

    if (Object.keys(errors).length > 0) return { ok: false, errors, values: v };

    return {
        ok: true,
        data: {
            label: v.label,
            plate: v.plate,
            transmission: v.transmission as TransmissionValue,
            active: v.status === "active",
            nextServiceDate,
            notes: v.notes || null,
        },
    };
}

export type ServiceState =
    | { state: "none" }
    | { state: "ok" | "soon" | "overdue"; days: number };

/**
 * Where a car stands with its next service. `days` is the number of days until the date
 * (negative when it has passed). Dates in the database are whole days, compared in UTC.
 */
export function serviceState(date: Date | null, now: Date = new Date()): ServiceState {
    if (!date) return { state: "none" };
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((date.getTime() - today) / 86_400_000);
    if (days < 0) return { state: "overdue", days };
    if (days <= SERVICE_SOON_DAYS) return { state: "soon", days };
    return { state: "ok", days };
}

/** "En retard de 12 j", "Dans 9 j", "Aujourd’hui". Empty for dates far away or not planned. */
export function serviceText(info: ServiceState): string {
    if (info.state === "none" || info.state === "ok") return "";
    if (info.days === 0) return "Aujourd’hui";
    if (info.days < 0) return `En retard de ${-info.days} j`;
    return `Dans ${info.days} j`;
}
