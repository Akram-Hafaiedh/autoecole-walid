"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { btnPrimary, input } from "@/lib/ui";

export function LoginForm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError(null);

        const { data, error } = await authClient.signIn.email({
            email: String(form.get("email") ?? "").trim(),
            password: String(form.get("password") ?? ""),
        });

        if (error) {
            setPending(false);
            setError(
                error.status === 429
                    ? "Trop d’essais. Réessayez dans quelques minutes."
                    : error.status === 401
                        ? "E-mail ou mot de passe incorrect."
                        : `Erreur ${error.status} : ${error.code ?? error.message ?? "inconnue"}`,
            );
            return;
        }

        // A registered account stays locked out until the owner activates it.
        if ((data?.user as { role?: string } | undefined)?.role !== "admin") {
            await authClient.signOut();
            setPending(false);
            setError("Votre compte n’est pas encore activé. Contactez le responsable.");
            return;
        }
        router.push("/admin");
        router.refresh();
    }

    const invalid = error ? true : undefined;

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {error && (
                <p
                    id="login-error"
                    role="alert"
                    className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger"
                >
                    {error}
                </p>
            )}

            <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                    E-mail
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    autoFocus
                    aria-invalid={invalid}
                    aria-describedby={invalid ? "login-error" : undefined}
                    className={`${input} aria-invalid:border-danger`}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                    Mot de passe
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    aria-invalid={invalid}
                    className={`${input} aria-invalid:border-danger`}
                />
            </div>

            <button type="submit" disabled={pending} className={`${btnPrimary} mt-2 w-full py-3`}>
                {pending ? "Connexion…" : "Se connecter"}
            </button>
        </form>
    );
}
