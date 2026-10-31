"use client";

import Link from "next/link";
import { useActionState } from "react";
import { btnPrimary, btnSecondary } from "@/lib/ui";
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

const input =
    "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand";

function Field({
    name,
    label,
    error,
    hint,
    children,
}: {
    name: StudentField;
    label: string;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={name} className="text-sm font-medium">
                {label}
            </label>
            {children}
            {hint && !error && <p className="text-xs text-muted">{hint}</p>}
            {error && (
                <p id={`${name}-error`} className="text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}

export function StudentForm({ action, initial, submitLabel }: Props) {
    const [state, formAction, pending] = useActionState(action, {} as StudentFormState);
    const value = (field: StudentField) => state.values?.[field] ?? initial[field];

    const common = (name: StudentField) => ({
        id: name,
        name,
        defaultValue: value(name),
        className: input,
        "aria-invalid": state.errors?.[name] ? true : undefined,
        "aria-describedby": state.errors?.[name] ? `${name}-error` : undefined,
    });

    return (
        <form action={formAction} className="flex max-w-2xl flex-col gap-5">
            {state.message && (
                <p role="alert" className="rounded-md border border-line bg-surface p-3 text-sm text-red-600">
                    {state.message}
                </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
                <Field name="firstName" error={state.errors?.firstName} label="Prénom">
                    <input {...common("firstName")} type="text" required maxLength={80} autoComplete="off" />
                </Field>
                <Field name="lastName" error={state.errors?.lastName} label="Nom">
                    <input {...common("lastName")} type="text" required maxLength={80} autoComplete="off" />
                </Field>
                <Field name="phone" error={state.errors?.phone} label="Téléphone">
                    <input {...common("phone")} type="tel" maxLength={20} autoComplete="off" />
                </Field>
                <Field name="email" error={state.errors?.email} label="E-mail">
                    <input {...common("email")} type="email" maxLength={120} autoComplete="off" />
                </Field>
                <Field name="birthDate" error={state.errors?.birthDate} label="Date de naissance">
                    <input {...common("birthDate")} type="date" />
                </Field>
                <Field name="nationalId" error={state.errors?.nationalId} label="N° de carte d’identité" hint="Visible uniquement dans l’administration.">
                    <input {...common("nationalId")} type="text" maxLength={30} autoComplete="off" />
                </Field>
                <Field name="licenceCategory" error={state.errors?.licenceCategory} label="Catégorie de permis" hint="Par exemple B, A, A1, C.">
                    <input {...common("licenceCategory")} type="text" required maxLength={4} />
                </Field>
                <Field name="status" error={state.errors?.status} label="Statut">
                    <select {...common("status")}>
                        {STUDENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>

            <Field name="notes" error={state.errors?.notes} label="Notes">
                <textarea {...common("notes")} rows={4} maxLength={2000} />
            </Field>

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
