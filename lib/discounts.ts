// The discount form (an offer the school makes). Only imports other pure helpers.

import { readFields, type FormState } from "@/lib/form";
import { formatMoney, parseMoney, toMoneyInput } from "@/lib/money";
import { parseDateOnly } from "@/lib/validation";

export const DISCOUNT_KINDS = ["percent", "fixed"] as const;
export type DiscountKindValue = (typeof DISCOUNT_KINDS)[number];

export const DISCOUNT_KIND_LABELS: Record<DiscountKindValue, string> = {
    percent: "Pourcentage",
    fixed: "Montant fixe",
};

export type DiscountField = "name" | "kind" | "value" | "status" | "validFrom" | "validTo";
export type DiscountFormState = FormState<DiscountField>;
export const DISCOUNT_FIELDS: readonly DiscountField[] = ["name", "kind", "value", "status", "validFrom", "validTo"];

export type DiscountInput = {
    name: string;
    kind: DiscountKindValue;
    value: number;
    active: boolean;
    validFrom: Date | null;
    validTo: Date | null;
};

export type DiscountParseResult =
    | { ok: true; data: DiscountInput }
    | { ok: false; errors: NonNullable<DiscountFormState["errors"]>; values: NonNullable<DiscountFormState["values"]> };

export function parseDiscountForm(formData: FormData): DiscountParseResult {
    const v = readFields(formData, DISCOUNT_FIELDS);
    const errors: NonNullable<DiscountFormState["errors"]> = {};

    if (v.name.length < 2) errors.name = "Donnez un nom à cette remise.";
    else if (v.name.length > 60) errors.name = "60 caractères au maximum.";

    const kind = (DISCOUNT_KINDS as readonly string[]).includes(v.kind) ? (v.kind as DiscountKindValue) : null;
    if (!kind) errors.kind = "Choisissez un type de remise.";

    let value = 0;
    if (kind === "percent") {
        if (!/^\d{1,3}$/.test(v.value) || Number(v.value) < 1 || Number(v.value) > 100) {
            errors.value = "Un pourcentage entier entre 1 et 100.";
        } else value = Number(v.value);
    } else if (kind === "fixed") {
        const amount = parseMoney(v.value);
        if (amount === null || amount === 0) errors.value = "Montant invalide (par exemple 50 ou 12,5).";
        else value = amount;
    }

    const status = v.status === "inactive" ? "inactive" : "active";

    const dates: Record<"validFrom" | "validTo", Date | null> = { validFrom: null, validTo: null };
    for (const key of ["validFrom", "validTo"] as const) {
        if (!v[key]) continue;
        const parsed = parseDateOnly(v[key]);
        if (!parsed) errors[key] = "Date invalide.";
        else dates[key] = parsed;
    }
    if (dates.validFrom && dates.validTo && dates.validTo < dates.validFrom) {
        errors.validTo = "La fin ne peut pas être avant le début.";
    }

    if (Object.keys(errors).length > 0 || !kind) return { ok: false, errors, values: v };
    return {
        ok: true,
        data: { name: v.name, kind, value, active: status === "active", ...dates },
    };
}

/** "10 %" or "50 DT". */
export function describeDiscount(kind: DiscountKindValue, value: number): string {
    return kind === "percent" ? `${value} %` : formatMoney(value);
}

/** What goes into the value input when editing. */
export function discountValueInput(kind: DiscountKindValue, value: number): string {
    return kind === "percent" ? String(value) : toMoneyInput(value);
}
