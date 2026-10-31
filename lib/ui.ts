// Shared Tailwind class strings, so buttons, inputs and panels look the same everywhere.

const button =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60";

export const btnPrimary = `${button} bg-brand text-brand-contrast hover:bg-brand-ink`;
export const btnSecondary = `${button} border border-line-strong bg-surface text-foreground hover:bg-surface-2`;
export const btnGhost = `${button} text-muted hover:bg-line/60 hover:text-foreground`;

export const input =
    "w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand/40";

/** A white surface with a hairline border. Use for the main content blocks of a page. */
export const panel = "rounded-2xl border border-line bg-surface";
