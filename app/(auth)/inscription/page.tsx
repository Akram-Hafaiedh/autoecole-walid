import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Créer un compte",
    robots: { index: false, follow: false },
};

export default async function RegisterPage() {
    if (await isAdmin()) redirect("/admin");

    return (
        <AuthShell
            title="Créer un compte"
            intro="Un nouveau compte doit être activé par le responsable avant de pouvoir se connecter."
        >
            <RegisterForm />
            <p className="mt-6 text-center text-sm text-muted">
                Déjà un compte ?{" "}
                <Link href="/connexion" className="font-medium text-brand-ink underline">
                    Se connecter
                </Link>
            </p>
        </AuthShell>
    );
}
