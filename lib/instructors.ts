// Instructor form validation and labels. Only imports other pure helpers, so it can be tested on its own.

import { readFields, type FormState } from "@/lib/form";
import { isEmail, isPhone } from "@/lib/validation";

export const INSTRUCTOR_STATUSES = ["active", "inactive"] as const;
export type InstructorStatusValue = (typeof INSTRUCTOR_STATUSES)[number];

export const INSTRUCTOR_STATUS_LABELS: Record<InstructorStatusValue, string> = {
    active: "Actif",
    inactive: "Inactif",
};

export type InstructorField = "firstName" | "lastName" | "phone" | "email" | "status";
export type InstructorFormState = FormState<InstructorField>;

export type InstructorInput = {
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    active: boolean;
};

export type InstructorParseResult =
    | { ok: true; data: InstructorInput }
    | { ok: false; errors: NonNullable<InstructorFormState["errors"]>; values: NonNullable<InstructorFormState["values"]> };

const FIELDS: readonly InstructorField[] = ["firstName", "lastName", "phone", "email", "status"];

export function parseInstructorForm(formData: FormData): InstructorParseResult {
    const v = readFields(formData, FIELDS);
    const errors: NonNullable<InstructorFormState["errors"]> = {};

    if (!v.firstName) errors.firstName = "Le prénom est obligatoire.";
    else if (v.firstName.length > 80) errors.firstName = "80 caractères au maximum.";

    if (!v.lastName) errors.lastName = "Le nom est obligatoire.";
    else if (v.lastName.length > 80) errors.lastName = "80 caractères au maximum.";

    if (v.phone && !isPhone(v.phone)) errors.phone = "Numéro invalide (6 à 20 chiffres, espaces ou +).";
    if (v.email && !isEmail(v.email)) errors.email = "Adresse e-mail invalide.";

    if (!(INSTRUCTOR_STATUSES as readonly string[]).includes(v.status)) errors.status = "Statut invalide.";

    if (Object.keys(errors).length > 0) return { ok: false, errors, values: v };

    return {
        ok: true,
        data: {
            firstName: v.firstName,
            lastName: v.lastName,
            phone: v.phone || null,
            email: v.email || null,
            active: v.status === "active",
        },
    };
}
