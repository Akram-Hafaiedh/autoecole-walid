import { site } from "@/lib/site";

/** The mark is a road seen from above: green tarmac with a yellow centre-line. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
            <rect width="32" height="32" rx="9" fill="var(--brand)" />
            <rect x="14.5" y="5" width="3" height="7" rx="1.5" fill="var(--accent)" />
            <rect x="14.5" y="20" width="3" height="7" rx="1.5" fill="var(--accent)" />
        </svg>
    );
}

export function Logo({ className = "" }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-2.5 ${className}`}>
            <LogoMark />
            <span className="font-display text-lg font-bold leading-none tracking-tight">{site.name}</span>
        </span>
    );
}
