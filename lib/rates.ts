// The standard price list form: one row per kind of lesson. Only imports other pure helpers.

import { PRICE_MODES, type PriceMode } from "@/lib/billing";
import { readFields, type FormState } from "@/lib/form";
import { LESSON_KINDS, type LessonKindValue } from "@/lib/lessons";
import { parseMoney, toMoneyInput } from "@/lib/money";

/** Field names are the kind followed by Mode, Amount or Fee, for example "drivingAmount". */
export type RateField = `${LessonKindValue}${"Mode" | "Amount" | "Fee"}`;
export type RatesFormState = FormState<RateField>;

export const RATE_FIELDS: readonly RateField[] = LESSON_KINDS.flatMap((kind) => [
    `${kind}Mode` as const,
    `${kind}Amount` as const,
    `${kind}Fee` as const,
]);

/** Driving is usually sold by the hour, the others by the session. Only a starting suggestion. */
export const DEFAULT_MODES: Record<LessonKindValue, PriceMode> = {
    driving: "per_hour",
    code: "per_session",
    exam: "per_session",
    refresher: "per_hour",
};

export type RateRow = { kind: LessonKindValue; mode: PriceMode; amount: number; absenceFee: number };

export type RatesParseResult =
    | { ok: true; save: RateRow[]; remove: LessonKindValue[] }
    | { ok: false; errors: NonNullable<RatesFormState["errors"]>; values: NonNullable<RatesFormState["values"]> };

export function parseRatesForm(formData: FormData): RatesParseResult {
    const v = readFields(formData, RATE_FIELDS);
    const errors: NonNullable<RatesFormState["errors"]> = {};
    const save: RateRow[] = [];
    const remove: LessonKindValue[] = [];

    for (const kind of LESSON_KINDS) {
        const modeKey = `${kind}Mode` as const;
        const amountKey = `${kind}Amount` as const;
        const feeKey = `${kind}Fee` as const;

        // No amount means no standard price for this kind.
        if (v[amountKey] === "") {
            if (v[feeKey] !== "") errors[feeKey] = "Indiquez d’abord le tarif.";
            else remove.push(kind);
            continue;
        }

        const mode = (PRICE_MODES as readonly string[]).includes(v[modeKey]) ? (v[modeKey] as PriceMode) : null;
        if (!mode) errors[modeKey] = "Choisissez par séance ou par heure.";

        const amount = parseMoney(v[amountKey]);
        if (amount === null) errors[amountKey] = "Montant invalide (par exemple 25 ou 12,5).";

        const absenceFee = v[feeKey] === "" ? 0 : parseMoney(v[feeKey]);
        if (absenceFee === null) errors[feeKey] = "Montant invalide.";

        if (mode && amount !== null && absenceFee !== null) save.push({ kind, mode, amount, absenceFee });
    }

    return Object.keys(errors).length > 0 ? { ok: false, errors, values: v } : { ok: true, save, remove };
}

/** The values to show in the form, from the rows saved in the database. */
export function ratesToForm(rows: { kind: LessonKindValue; mode: PriceMode; amount: number; absenceFee: number }[]) {
    const values = {} as Record<RateField, string>;
    for (const kind of LESSON_KINDS) {
        const row = rows.find((r) => r.kind === kind);
        values[`${kind}Mode`] = row?.mode ?? DEFAULT_MODES[kind];
        values[`${kind}Amount`] = row ? toMoneyInput(row.amount) : "";
        values[`${kind}Fee`] = row && row.absenceFee > 0 ? toMoneyInput(row.absenceFee) : "";
    }
    return values;
}
