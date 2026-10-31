// Student form validation and labels. Only imports other pure helpers, so it runs on the
// server and in the browser, and can be tested on its own.

import type { FormState } from "@/lib/form";
import { isEmail, isPhone, parseDateOnly } from "@/lib/validation";

export const STUDENT_STATUSES = ["active", "paused", "completed", "archived"] as const;
export type StudentStatusValue = (typeof STUDENT_STATUSES)[number];

export const STATUS_LABELS: Record<StudentStatusValue, string> = {
    active: "Actif",
    paused: "En pause",
    completed: "Terminé",
    archived: "Archivé",
};

export const PAGE_SIZE = 15;

/** Reads ?page=. Anything that is not a positive whole number means page 1. */
export function parsePage(value: string | undefined): number {
    const page = Number.parseInt(value ?? "", 10);
    return Number.isFinite(page) && page >= 1 ? Math.min(page, 10_000) : 1;
}

/** Builds the list URL, keeping the search and the status filter. */
export function studentsHref(params: { q?: string; statut?: string; page?: number }): string {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.statut) query.set("statut", params.statut);
    if (params.page && params.page > 1) query.set("page", String(params.page));
    const text = query.toString();
    return text ? `/admin/eleves?${text}` : "/admin/eleves";
}

export type StudentField =
    | "firstName"
    | "lastName"
    | "phone"
    | "email"
    | "birthDate"
    | "nationalId"
    | "licenceCategory"
    | "status"
    | "notes";

export type StudentFormState = FormState<StudentField>;

export type StudentInput = {
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    birthDate: Date | null;
    nationalId: string | null;
    licenceCategory: string;
    status: StudentStatusValue;
    notes: string | null;
};

export type ParseResult =
    | { ok: true; data: StudentInput }
    | { ok: false; errors: NonNullable<StudentFormState["errors"]>; values: NonNullable<StudentFormState["values"]> };

const FIELDS: StudentField[] = [
    "firstName",
    "lastName",
    "phone",
    "email",
    "birthDate",
    "nationalId",
    "licenceCategory",
    "status",
    "notes",
];

export function parseStudentForm(formData: FormData, now: Date = new Date()): ParseResult {
    const values: Partial<Record<StudentField, string>> = {};
    for (const field of FIELDS) {
        values[field] = String(formData.get(field) ?? "").trim();
    }
    const v = values as Record<StudentField, string>;
    const errors: NonNullable<StudentFormState["errors"]> = {};

    if (!v.firstName) errors.firstName = "Le prénom est obligatoire.";
    else if (v.firstName.length > 80) errors.firstName = "80 caractères au maximum.";

    if (!v.lastName) errors.lastName = "Le nom est obligatoire.";
    else if (v.lastName.length > 80) errors.lastName = "80 caractères au maximum.";

    if (v.phone && !isPhone(v.phone)) {
        errors.phone = "Numéro invalide (6 à 20 chiffres, espaces ou +).";
    }

    if (v.email && !isEmail(v.email)) {
        errors.email = "Adresse e-mail invalide.";
    }

    let birthDate: Date | null = null;
    if (v.birthDate) {
        const parsed = parseDateOnly(v.birthDate);
        if (!parsed) {
            errors.birthDate = "Date invalide.";
        } else if (parsed.getUTCFullYear() < 1900 || parsed.getTime() > now.getTime()) {
            errors.birthDate = "Date de naissance impossible.";
        } else {
            birthDate = parsed;
        }
    }

    if (v.nationalId.length > 30) errors.nationalId = "30 caractères au maximum.";

    const licence = v.licenceCategory.toUpperCase();
    if (!/^[A-Z0-9]{1,4}$/.test(licence)) {
        errors.licenceCategory = "Catégorie invalide (1 à 4 lettres ou chiffres).";
    }

    if (!(STUDENT_STATUSES as readonly string[]).includes(v.status)) {
        errors.status = "Statut invalide.";
    }

    if (v.notes.length > 2000) errors.notes = "2000 caractères au maximum.";

    if (Object.keys(errors).length > 0) return { ok: false, errors, values };

    return {
        ok: true,
        data: {
            firstName: v.firstName,
            lastName: v.lastName,
            phone: v.phone || null,
            email: v.email || null,
            birthDate,
            nationalId: v.nationalId || null,
            licenceCategory: licence,
            status: v.status as StudentStatusValue,
            notes: v.notes || null,
        },
    };
}
