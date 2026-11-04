import Link from "next/link";

/** The Mois / Année switch of the summary. Each side is a link, so it works without JavaScript. */
export function ViewToggle({
    active,
    monthHref,
    yearHref,
}: {
    active: "month" | "year";
    monthHref: string;
    yearHref: string;
}) {
    const base = "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand";
    const on = "bg-surface text-foreground shadow-card";
    const off = "text-muted hover:text-foreground";

    return (
        <nav aria-label="Période" className="inline-flex gap-1 rounded-lg bg-surface-2 p-1">
            <Link href={monthHref} aria-current={active === "month" ? "page" : undefined} className={`${base} ${active === "month" ? on : off}`}>
                Mois
            </Link>
            <Link href={yearHref} aria-current={active === "year" ? "page" : undefined} className={`${base} ${active === "year" ? on : off}`}>
                Année
            </Link>
        </nav>
    );
}
