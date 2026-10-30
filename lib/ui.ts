// Shared Tailwind class strings so buttons look the same everywhere.

const base =
    "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const btnPrimary = `${base} bg-brand text-brand-contrast hover:opacity-90`;
export const btnSecondary = `${base} border border-line bg-surface text-foreground hover:bg-line/40`;
