"use client";

import Link from "next/link";
import { useActionState } from "react";
import { btnPrimary, btnSecondary, input, panel } from "@/lib/ui";
import {
    STATUS_LABELS,
    STUDENT_STATUSES,
    type StudentField,
    type StudentFormState,
} from "@/lib/students";

type Props = {
    action: (state: StudentFormState, formData: FormData) => Promise<StudentFormState>;
    initial: Record<StudentField, string>;
    submitLabel: string;
};

function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className={`${panel} p-5 sm:p-6`}>
            <div className="mb-5">
                <h2 className="font-display text-lg font-semibold">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">{children}</div>
        </section>
    );
}

function Field({
    name,
    label,
    error,
    hint,
    full,
    children,
}: {
    name: StudentField;
    label: string;
    error?: string;
    hint?: string;
    full?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
            <label htmlFor={name} className="text-sm font-medium">
                {label}
            </label>
            {children}
            {hint && !error && <p className="text-xs text-muted">{hint}</p>}
            {error && (
                <p id={`${name}-error`} className="text-xs font-medium text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}

export function StudentForm({ action, initial, submitLabel }: Props) {
    const [state, formAction, pending] = useActionState(action, {} as StudentFormState);
    const value = (field: StudentField) => state.values?.[field] ?? initial[field];
    const error = (field: StudentField) => state.errors?.[field];

    const common = (name: StudentField) => ({
        id: name,
        name,
        defaultValue: value(name),
        className: `${input} aria-invalid:border-danger`,
        "aria-invalid": error(name) ? true : undefined,
        "aria-describedby": error(name) ? `${name}-error` : undefined,
    });

    return (
        <form action={formAction} className="flex max-w-3xl flex-col gap-6">
            {state.message && (
                <p
                    role="alert"
                    className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
                >
                    {state.message}
                </p>
            )}

            <Section title="Identité">
                <Field name="firstName" label="Prénom" error={error("firstName")}>
                    <input {...common("firstName")} type="text" required maxLength={80} autoComplete="off" />
                </Field>
                <Field name="lastName" label="Nom" error={error("lastName")}>
                    <input {...common("lastName")} type="text" required maxLength={80} autoComplete="off" />
                </Field>
                <Field name="birthDate" label="Date de naissance" error={error("birthDate")}>
                    <input {...common("birthDate")} type="date" />
                </Field>
                <Field
                    name="nationalId"
                    label="N° de carte d’identité"
                    error={error("nationalId")}
                    hint="Visible uniquement dans l’administration."
                >
                    <input {...common("nationalId")} type="text" maxLength={30} autoComplete="off" />
                </Field>
            </Section>

            <Section title="Contact">
                <Field name="phone" label="Téléphone" error={error("phone")}>
                    <input {...common("phone")} type="tel" maxLength={20} autoComplete="off" />
                </Field>
                <Field name="email" label="E-mail" error={error("email")}>
                    <input {...common("email")} type="email" maxLength={120} autoComplete="off" />
                </Field>
            </Section>

            <Section title="Dossier">
                <Field
                    name="licenceCategory"
                    label="Catégorie de permis"
                    error={error("licenceCategory")}
                    hint="Par exemple B, A, A1, C."
                >
                    <input {...common("licenceCategory")} type="text" required maxLength={4} />
                </Field>
                <Field
                    name="status"
                    label="Statut"
                    error={error("status")}
                    hint="Passez à « Archivé » pour retirer l’élève de la liste."
                >
                    <select {...common("status")}>
                        {STUDENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field name="notes" label="Notes" error={error("notes")} full>
                    <textarea {...common("notes")} rows={4} maxLength={2000} />
                </Field>
            </Section>

            <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={pending} className={btnPrimary}>
                    {pending ? "Enregistrement…" : submitLabel}
                </button>
                <Link href="/admin/eleves" className={btnSecondary}>
                    Annuler
                </Link>
            </div>
        </form>
    );
}
