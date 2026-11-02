import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/** The split layout shared by the login and registration pages. */
export function AuthShell({
    title,
    intro,
    children,
}: {
    title: string;
    intro: string;
    children: ReactNode;
}) {
    return (
        <main className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
            <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-ink lg:flex">
                <Logo />
                <div className="max-w-md">
                    <h2 className="font-display text-5xl leading-[1.05] font-bold tracking-tight text-balance">
                        Élèves, moniteurs et véhicules au même endroit.
                    </h2>
                    <p className="mt-5 text-base text-sidebar-muted">
                        Espace réservé à l’équipe de l’auto-école.
                    </p>
                </div>
                <span aria-hidden="true" className="road-line absolute inset-y-0 right-14 opacity-90" />
                <span aria-hidden="true" className="h-4" />
            </aside>

            <section className="relative flex items-center justify-center px-6 py-12">
                <ThemeToggle className="absolute top-4 right-4 grid size-10 place-items-center rounded-lg text-muted transition-colors hover:bg-line/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" />
                <div className="w-full max-w-sm">
                    <Logo className="mb-10 lg:hidden" />
                    <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
                    <p className="mt-2 mb-8 text-sm text-muted">{intro}</p>
                    {children}
                </div>
            </section>
        </main>
    );
}
