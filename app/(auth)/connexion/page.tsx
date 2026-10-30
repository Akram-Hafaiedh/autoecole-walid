import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { site } from "@/lib/site";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
    title: "Connexion",
    robots: { index: false, follow: false },
};

export default async function LoginPage() {
    if (await isAdmin()) redirect("/admin");

    return (
        <main className="flex flex-1 items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-6">
                <p className="text-sm text-muted">{site.name}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">Connexion</h1>
                <p className="mt-2 mb-6 text-sm text-muted">
                    Un code à usage unique est envoyé à l’adresse e-mail du responsable.
                </p>
                <LoginForm />
            </div>
        </main>
    );
}
