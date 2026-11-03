// Money is stored as a whole number of millimes (1 dinar = 1000 millimes), so adding and
// splitting amounts never produces rounding errors. No imports, so it runs on the server and in
// the browser and can be tested on its own.

export const MILLIMES_PER_DINAR = 1000;
/** A sanity limit on one amount: 100 000 dinars. Keeps sums far from the 32-bit integer limit. */
export const MAX_AMOUNT = 100_000 * MILLIMES_PER_DINAR;

/**
 * Reads what a person types in a price field: "120", "120,5", "120.500", "1 200,000".
 * Returns millimes, or null when it is not a valid amount. A single comma or dot is the
 * decimal mark, with at most three decimals; spaces are ignored. Negative amounts are refused.
 */
export function parseMoney(input: string): number | null {
    const text = input.replace(/[\s  ]/g, "");
    if (!/^\d+([.,]\d{1,3})?$/.test(text)) return null;

    const [dinars, decimals = ""] = text.split(/[.,]/);
    const millimes = Number(dinars) * MILLIMES_PER_DINAR + Number(decimals.padEnd(3, "0"));
    return Number.isSafeInteger(millimes) && millimes <= MAX_AMOUNT ? millimes : null;
}

/** 120000 becomes "120", 120500 becomes "120,5". For filling an input. */
export function toMoneyInput(millimes: number | null | undefined): string {
    if (millimes === null || millimes === undefined) return "";
    const dinars = Math.trunc(millimes / MILLIMES_PER_DINAR);
    const rest = Math.abs(millimes % MILLIMES_PER_DINAR);
    return rest === 0 ? String(dinars) : `${dinars},${String(rest).padStart(3, "0").replace(/0+$/, "")}`;
}

/** 1250000 becomes "1 250 DT", 120500 becomes "120,500 DT". Negative amounts keep their sign. */
export function formatMoney(millimes: number, currency = "DT"): string {
    const sign = millimes < 0 ? "−" : "";
    const abs = Math.abs(millimes);
    const dinars = Math.floor(abs / MILLIMES_PER_DINAR);
    const rest = abs % MILLIMES_PER_DINAR;

    const grouped = String(dinars).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const decimals = rest === 0 ? "" : `,${String(rest).padStart(3, "0")}`;
    return `${sign}${grouped}${decimals} ${currency}`;
}
