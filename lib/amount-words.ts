// An amount written out in French, for the line "Arrêté à la somme de …" on a receipt.
// Pure, no imports. Works up to 999 999 dinars (the largest amount the app accepts is 100 000).

const UNITS = [
    "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
    "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

/** 0 to 99. `final` is false when "mille" follows: quatre-vingt mille, not quatre-vingts mille. */
function below100(n: number, final: boolean): string {
    if (n < 20) return UNITS[n];
    const tens = Math.floor(n / 10);
    const unit = n % 10;
    if (tens <= 6) {
        if (unit === 0) return TENS[tens];
        return unit === 1 ? `${TENS[tens]} et un` : `${TENS[tens]}-${UNITS[unit]}`;
    }
    if (tens === 7) return unit === 1 ? "soixante et onze" : `soixante-${UNITS[10 + unit]}`;
    if (tens === 8) return unit === 0 ? (final ? "quatre-vingts" : "quatre-vingt") : `quatre-vingt-${UNITS[unit]}`;
    return `quatre-vingt-${UNITS[10 + unit]}`;
}

/** 0 to 999. */
function below1000(n: number, final: boolean): string {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    if (hundreds === 0) return below100(rest, final);
    const head = hundreds === 1 ? "cent" : `${UNITS[hundreds]} cent${rest === 0 && final ? "s" : ""}`;
    return rest === 0 ? head : `${head} ${below100(rest, final)}`;
}

/** 0 to 999 999 in words: 80 is "quatre-vingts", 2000 is "deux mille". */
export function numberInWords(n: number): string {
    if (n === 0) return "zéro";
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    const tail = rest === 0 ? "" : ` ${below1000(rest, true)}`;
    if (thousands === 0) return below1000(rest, true);
    const head = thousands === 1 ? "mille" : `${below1000(thousands, false)} mille`;
    return `${head}${tail}`;
}

/** 120500 millimes becomes "Cent vingt dinars et cinq cents millimes". */
export function amountInWords(millimes: number): string {
    const dinars = Math.floor(millimes / 1000);
    const rest = millimes % 1000;
    const parts: string[] = [];
    if (dinars > 0 || rest === 0) parts.push(`${numberInWords(dinars)} dinar${dinars > 1 ? "s" : ""}`);
    if (rest > 0) parts.push(`${numberInWords(rest)} millime${rest > 1 ? "s" : ""}`);
    const text = parts.join(" et ");
    return text.charAt(0).toUpperCase() + text.slice(1);
}
