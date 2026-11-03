// How lessons are priced and how a student's account adds up. Pure functions with no
// imports, so every rule can be tested on its own.
//
// Prices, from the most specific to the least:
//   1. a price set on this one lesson,
//   2. the student's total price (a "forfait"): their lessons are then included,
//   3. a price agreed with this student for this kind of lesson,
//   4. the school's standard price for this kind of lesson.
// A price is either per session (one amount) or per hour (amount x hours).
//
// A lesson is billed only once it is done. An absent student pays nothing, except for the
// optional absence fee set on the standard price of that kind of lesson (0 by default).
// The amount is worked out when the lesson is marked done and then kept, so changing a
// price later never rewrites old lessons.

export const PRICE_MODES = ["per_session", "per_hour"] as const;
export type PriceMode = (typeof PRICE_MODES)[number];

export const PRICE_MODE_LABELS: Record<PriceMode, string> = {
    per_session: "par séance",
    per_hour: "par heure",
};

export type Price = { mode: PriceMode; amount: number };
export type StandardRate = Price & { absenceFee: number };

/** Where a lesson's amount comes from. Shown next to the amount. */
export const CHARGE_SOURCES = ["standard", "student", "custom", "package", "absence"] as const;
export type ChargeSource = (typeof CHARGE_SOURCES)[number];

export const CHARGE_SOURCE_LABELS: Record<ChargeSource, string> = {
    standard: "Tarif habituel",
    student: "Tarif convenu avec l’élève",
    custom: "Prix de cette leçon",
    package: "Inclus dans le forfait",
    absence: "Frais d’absence",
};

type LessonStatus = "scheduled" | "completed" | "cancelled" | "no_show";

/** The amount of one lesson that lasts `minutes`, in millimes. */
export function priceAmount(price: Price, minutes: number): number {
    return price.mode === "per_hour" ? Math.round((price.amount * minutes) / 60) : price.amount;
}

export type ChargeInput = {
    status: LessonStatus;
    minutes: number;
    custom: Price | null;
    studentRate: Price | null;
    standardRate: StandardRate | null;
    /** The student has agreed a total price for everything. */
    hasPackage: boolean;
};

/** amount is null while nothing is billed yet (planned, cancelled) or when no price exists. */
export type Charge = { amount: number | null; source: ChargeSource | null };

export function chargeLesson(input: ChargeInput): Charge {
    const { status, minutes, custom, studentRate, standardRate, hasPackage } = input;

    if (status === "scheduled" || status === "cancelled") return { amount: null, source: null };

    if (status === "no_show") {
        if (hasPackage) return { amount: 0, source: "package" };
        return { amount: standardRate?.absenceFee ?? 0, source: "absence" };
    }

    if (custom) return { amount: priceAmount(custom, minutes), source: "custom" };
    if (hasPackage) return { amount: 0, source: "package" };
    if (studentRate) return { amount: priceAmount(studentRate, minutes), source: "student" };
    if (standardRate) return { amount: priceAmount(standardRate, minutes), source: "standard" };
    return { amount: null, source: null };
}

export type DiscountLine = { kind: "percent" | "fixed"; value: number };

/** What the discounts take off `charges`. Never more than the charges themselves. */
export function discountTotal(charges: number, discounts: DiscountLine[]): number {
    let total = 0;
    for (const discount of discounts) {
        total += discount.kind === "percent" ? Math.round((charges * discount.value) / 100) : discount.value;
    }
    return Math.min(total, Math.max(charges, 0));
}

export type AccountInput = {
    /** The total price agreed with the student, or null when they pay lesson by lesson. */
    packageTotal: number | null;
    lessons: { status: LessonStatus; amount: number | null }[];
    discounts: DiscountLine[];
    /** Payments that have not been cancelled. */
    payments: number[];
};

export type AccountSummary = {
    charges: number;
    discount: number;
    paid: number;
    /** Positive: the student still owes this. Negative: the student has paid more than billed. */
    balance: number;
    /** Done lessons that have no price yet, because no price existed when they were marked done. */
    unpriced: number;
};

export function accountSummary(input: AccountInput): AccountSummary {
    const billed = input.lessons.filter((l) => l.status === "completed" || l.status === "no_show");
    const unpriced = billed.filter((l) => l.amount === null).length;
    const charges = (input.packageTotal ?? 0) + billed.reduce((sum, l) => sum + (l.amount ?? 0), 0);
    const discount = discountTotal(charges, input.discounts);
    const paid = input.payments.reduce((sum, amount) => sum + amount, 0);
    return { charges, discount, paid, balance: charges - discount - paid, unpriced };
}

/** Whether a discount can be given on `today` (a date in UTC, time ignored). */
export function discountAvailable(
    discount: { active: boolean; validFrom: Date | null; validTo: Date | null },
    today: Date,
): boolean {
    if (!discount.active) return false;
    const day = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    if (discount.validFrom && day < discount.validFrom.getTime()) return false;
    if (discount.validTo && day > discount.validTo.getTime()) return false;
    return true;
}
