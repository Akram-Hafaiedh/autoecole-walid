// Road-sign meaning: green = fine, amber = watch out, red = act now, blue = done, grey = inactive.
const tones = {
    ok: "bg-ok-bg text-ok-fg",
    warn: "bg-warn-bg text-warn-fg",
    danger: "bg-danger/10 text-danger",
    info: "bg-info-bg text-info-fg",
    neutral: "bg-neutral-bg text-neutral-fg",
} as const;

export type PillTone = keyof typeof tones;

export function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${tones[tone]}`}
        >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {children}
        </span>
    );
}
