"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { btnPrimary, input } from "@/lib/ui";

const MIN_PASSWORD_LENGTH = 10;

export function RegisterForm() {
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const [done, setDone] = useState(false);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const password = String(form.get("password") ?? "");

        if (password !== String(form.get("confirm") ?? "")) {
            setError("Les deux mots de passe sont différents.");
            return;
        }
        setPending(true);
        setError(null);

        const { error } = await authClient.signUp.email({
            name: String(form.get("name") ?? "").trim(),
            email: String(form.get("email") ?? "").trim(),
            password,
        });

        setPending(false);
        if (error) {
            setError(
                error.status === 429
                    ? "Trop d’essais. Réessayez plus tard."
                    : error.status === 422
                        ? "Impossible de créer ce compte. Vérifiez les champs ou connectez-vous."
                        : "La création du compte a échoué.",
            );
            return;
        }
        setDone(true);
    }

    if (done) {
        return (
            <div role="status" className="rounded-lg bg-brand-soft px-4 py-4 text-sm text-brand-ink">
                <p className="font-medium">Compte créé.</p>
                <p className="mt-1">
                    Le responsable doit l’activer avant que vous puissiez vous connecter.{" "}
                    <Link href="/connexion" className="underline">
                        Retour à la connexion
                    </Link>
                </p>
            </div>
        );
    }

    const invalid = error ? true : undefined;

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {error && (
                <p
                    id="register-error"
                    role="alert"
                    className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger"
                >
                    {error}
                </p>
            )}

            <Field id="name" label="Nom complet" type="text" autoComplete="name" autoFocus invalid={invalid} />
            <Field id="email" label="E-mail" type="email" autoComplete="username" invalid={invalid} />
            <Field
                id="password"
                label={`Mot de passe (${MIN_PASSWORD_LENGTH} caractères minimum)`}
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                invalid={invalid}
            />
            <Field id="confirm" label="Confirmer le mot de passe" type="password" autoComplete="new-password" invalid={invalid} />

            <button type="submit" disabled={pending} className={`${btnPrimary} mt-2 w-full py-3`}>
                {pending ? "Création…" : "Créer le compte"}
            </button>
        </form>
    );
}

function Field({
    id,
    label,
    type,
    autoComplete,
    autoFocus,
    minLength,
    invalid,
}: {
    id: string;
    label: string;
    type: string;
    autoComplete: string;
    autoFocus?: boolean;
    minLength?: number;
    invalid?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-medium">
                {label}
            </label>
            <input
                id={id}
                name={id}
                type={type}
                autoComplete={autoComplete}
                autoFocus={autoFocus}
                minLength={minLength}
                required
                aria-invalid={invalid}
                aria-describedby={invalid ? "register-error" : undefined}
                className={`${input} aria-invalid:border-danger`}
            />
        </div>
    );
}
