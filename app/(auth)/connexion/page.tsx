import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Connexion",
    robots: { index: false, follow: false },
};

export default async function LoginPage() {
    if (await isAdmin()) redirect("/admin");

    return (
        <main className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
            <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-ink lg:flex">
                <Logo />
                <div className="max-w-md">
                    <h2 className="font-display text-5xl leading-[1.05] font-bold tracking-tight text-balance">
                        Élèves, moniteurs et véhicules au même endroit.
                    </h2>
                    <p className="mt-5 text-base text-sidebar-muted">
                        Espace réservé au responsable de l’auto-école.
                    </p>
                </div>
                <span aria-hidden="true" className="road-line absolute inset-y-0 right-14 opacity-90" />
                <span aria-hidden="true" className="h-4" />
            </aside>

            <section className="flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    <Logo className="mb-10 lg:hidden" />
                    <h1 className="font-display text-3xl font-bold tracking-tight">Connexion</h1>
                    <p className="mt-2 mb-8 text-sm text-muted">
                        Nous envoyons un code à usage unique à l’adresse <span className="whitespace-nowrap">e-mail</span> du responsable. Il est valable 10 minutes.
                    </p>
                    <LoginForm />
                </div>
            </section>
        </main>
    );
}
