import type { ReactNode } from "react";

/** The title band at the top of the inner public pages. */
export function PageIntro({
    eyebrow,
    title,
    children,
}: {
    eyebrow: string;
    title: string;
    children?: ReactNode;
}) {
    return (
        <section className="border-b border-line bg-surface">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
                <p className="text-sm font-semibold tracking-widest text-brand-ink uppercase">{eyebrow}</p>
                <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">
                    {title}
                </h1>
                {children && <p className="mt-4 max-w-xl text-lg text-muted">{children}</p>}
            </div>
        </section>
    );
}
