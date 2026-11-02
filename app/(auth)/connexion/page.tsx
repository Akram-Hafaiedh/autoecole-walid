import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Connexion",
    robots: { index: false, follow: false },
};

export default async function LoginPage() {
    if (await isAdmin()) redirect("/admin");

    return (
        <AuthShell title="Connexion" intro="Connectez-vous avec votre e-mail et votre mot de passe.">
            <LoginForm />
            <p className="mt-6 text-center text-sm text-muted">
                Pas encore de compte ?{" "}
                <Link href="/inscription" className="font-medium text-brand-ink underline">
                    Créer un compte
                </Link>
            </p>
        </AuthShell>
    );
}
