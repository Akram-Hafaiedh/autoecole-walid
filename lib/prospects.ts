// The contact form of the public site, and the follow-up of the requests it creates. Only
// imports other pure helpers, so it can be tested on its own.

import { readFields, type FormState } from "@/lib/form";
import { isEmail, isPhone } from "@/lib/validation";

export const PROSPECT_STATUSES = ["received", "contacted", "enrolled", "closed"] as const;
export type ProspectStatusValue = (typeof PROSPECT_STATUSES)[number];

export const PROSPECT_STATUS_LABELS: Record<ProspectStatusValue, string> = {
    received: "Nouvelle",
    contacted: "Contactée",
    enrolled: "Inscrite",
    closed: "Sans suite",
};

/** `fax` is a trap: it is hidden from people, so only a robot fills it in. */
export type ProspectField = "name" | "phone" | "email" | "interest" | "message" | "fax";
export type ProspectFormState = FormState<ProspectField>;
export const PROSPECT_FIELDS: readonly ProspectField[] = ["name", "phone", "email", "interest", "message", "fax"];

export type ProspectInput = {
    name: string;
    phone: string;
    email: string | null;
    interest: string | null;
    message: string | null;
};

export type ProspectParseResult =
    | { ok: true; data: ProspectInput }
    /** A robot filled the trap field: pretend it worked, store nothing. */
    | { ok: "robot" }
    | { ok: false; errors: NonNullable<ProspectFormState["errors"]>; values: NonNullable<ProspectFormState["values"]> };

/** `offerIds` are the offers that can be chosen (from lib/site.ts). */
export function parseProspectForm(formData: FormData, offerIds: readonly string[]): ProspectParseResult {
    const v = readFields(formData, PROSPECT_FIELDS);
    if (v.fax !== "") return { ok: "robot" };

    const errors: NonNullable<ProspectFormState["errors"]> = {};

    if (v.name.length < 2) errors.name = "Indiquez votre nom.";
    else if (v.name.length > 80) errors.name = "80 caractères au maximum.";

    if (!isPhone(v.phone)) errors.phone = "Indiquez un numéro de téléphone valide.";

    if (v.email !== "" && !isEmail(v.email)) errors.email = "Adresse e-mail invalide.";

    if (v.interest !== "" && !offerIds.includes(v.interest)) errors.interest = "Choix invalide.";

    if (v.message.length > 1000) errors.message = "1000 caractères au maximum.";

    if (Object.keys(errors).length > 0) return { ok: false, errors, values: v };
    return {
        ok: true,
        data: {
            name: v.name,
            phone: v.phone,
            email: v.email || null,
            interest: v.interest || null,
            message: v.message || null,
        },
    };
}

/** At most this many requests an hour, for the whole site. Above it the form asks to call instead. */
export const MAX_PER_HOUR = 30;
/** The same phone number cannot send twice within this many minutes. */
export const DUPLICATE_MINUTES = 10;

/** "Marie Dupont" becomes first name "Marie", last name "Dupont". One word goes to the last name. */
export function splitName(name: string): { firstName: string; lastName: string } {
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) return { firstName: "", lastName: parts[0] ?? "" };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}
