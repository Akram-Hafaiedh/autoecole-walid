// The forms on a student's account: the prices agreed with them, and their payments. Only
// imports other pure helpers, so it can be tested on its own.

import { PRICE_MODES, type PriceMode } from "@/lib/billing";
import { readFields, type FormState } from "@/lib/form";
import { LESSON_KINDS, type LessonKindValue } from "@/lib/lessons";
import { parseMoney, toMoneyInput } from "@/lib/money";
import { parseDateOnly } from "@/lib/validation";

// ---- Prices agreed with the student ----------------------------------------------------

/** packageTotal, plus the kind followed by Mode or Amount, for example "drivingAmount". */
export type StudentPriceField = "packageTotal" | `${LessonKindValue}${"Mode" | "Amount"}`;
export type StudentPricesState = FormState<StudentPriceField>;

export const STUDENT_PRICE_FIELDS: readonly StudentPriceField[] = [
    "packageTotal",
    ...LESSON_KINDS.flatMap((kind) => [`${kind}Mode` as const, `${kind}Amount` as const]),
];

export type StudentRateRow = { kind: LessonKindValue; mode: PriceMode; amount: number };

export type StudentPricesParse =
    | { ok: true; packageTotal: number | null; save: StudentRateRow[]; remove: LessonKindValue[] }
    | { ok: false; errors: NonNullable<StudentPricesState["errors"]>; values: NonNullable<StudentPricesState["values"]> };

export function parseStudentPrices(formData: FormData): StudentPricesParse {
    const v = readFields(formData, STUDENT_PRICE_FIELDS);
    const errors: NonNullable<StudentPricesState["errors"]> = {};
    const save: StudentRateRow[] = [];
    const remove: LessonKindValue[] = [];

    let packageTotal: number | null = null;
    if (v.packageTotal !== "") {
        packageTotal = parseMoney(v.packageTotal);
        if (packageTotal === null) errors.packageTotal = "Montant invalide (par exemple 1200).";
    }

    for (const kind of LESSON_KINDS) {
        const modeKey = `${kind}Mode` as const;
        const amountKey = `${kind}Amount` as const;

        // No amount: the standard price of that kind applies.
        if (v[amountKey] === "") {
            remove.push(kind);
            continue;
        }
        const mode = (PRICE_MODES as readonly string[]).includes(v[modeKey]) ? (v[modeKey] as PriceMode) : null;
        if (!mode) errors[modeKey] = "Choisissez par séance ou par heure.";
        const amount = parseMoney(v[amountKey]);
        if (amount === null) errors[amountKey] = "Montant invalide (par exemple 25 ou 12,5).";
        if (mode && amount !== null) save.push({ kind, mode, amount });
    }

    return Object.keys(errors).length > 0
        ? { ok: false, errors, values: v }
        : { ok: true, packageTotal, save, remove };
}

export function studentPricesToForm(
    packageTotal: number | null,
    rows: { kind: LessonKindValue; mode: PriceMode; amount: number }[],
    defaultModes: Record<LessonKindValue, PriceMode>,
) {
    const values = { packageTotal: toMoneyInput(packageTotal) } as Record<StudentPriceField, string>;
    for (const kind of LESSON_KINDS) {
        const row = rows.find((r) => r.kind === kind);
        values[`${kind}Mode`] = row?.mode ?? defaultModes[kind];
        values[`${kind}Amount`] = row ? toMoneyInput(row.amount) : "";
    }
    return values;
}

// ---- Payments ------------------------------------------------------------------------

export const PAYMENT_METHODS = ["cash", "transfer", "cheque", "other"] as const;
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> = {
    cash: "Espèces",
    transfer: "Virement",
    cheque: "Chèque",
    other: "Autre",
};

export type PaymentField = "amount" | "paidOn" | "method" | "note";
export type PaymentFormState = FormState<PaymentField>;
export const PAYMENT_FIELDS: readonly PaymentField[] = ["amount", "paidOn", "method", "note"];

export type PaymentInput = { amount: number; paidOn: Date; method: PaymentMethodValue; note: string | null };

export type PaymentParse =
    | { ok: true; data: PaymentInput }
    | { ok: false; errors: NonNullable<PaymentFormState["errors"]>; values: NonNullable<PaymentFormState["values"]> };

/** `today` is today's date at the school ("2026-11-03"): a payment cannot be dated after it. */
export function parsePaymentForm(formData: FormData, today: string): PaymentParse {
    const v = readFields(formData, PAYMENT_FIELDS);
    const errors: NonNullable<PaymentFormState["errors"]> = {};

    const amount = parseMoney(v.amount);
    if (amount === null || amount === 0) errors.amount = "Indiquez le montant reçu (par exemple 100 ou 12,5).";

    const paidOn = parseDateOnly(v.paidOn);
    if (!paidOn) errors.paidOn = "Date invalide.";
    else if (v.paidOn > today) errors.paidOn = "La date ne peut pas être dans le futur.";

    const method = (PAYMENT_METHODS as readonly string[]).includes(v.method) ? (v.method as PaymentMethodValue) : null;
    if (!method) errors.method = "Choisissez un mode de paiement.";

    if (v.note.length > 300) errors.note = "300 caractères au maximum.";

    if (Object.keys(errors).length > 0 || amount === null || !paidOn || !method) return { ok: false, errors, values: v };
    return { ok: true, data: { amount, paidOn, method, note: v.note || null } };
}

// ---- Giving a discount ---------------------------------------------------------------

export type GrantDiscountState = FormState<"discountId">;
