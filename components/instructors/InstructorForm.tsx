"use client";

import Link from "next/link";
import { Field, FormError, Section } from "@/components/ui/FormParts";
import { useFormFields } from "@/components/ui/useFormFields";
import {
    INSTRUCTOR_STATUSES,
    INSTRUCTOR_STATUS_LABELS,
    type InstructorField,
    type InstructorFormState,
} from "@/lib/instructors";
import { btnPrimary, btnSecondary } from "@/lib/ui";

type Props = {
    action: (state: InstructorFormState, formData: FormData) => Promise<InstructorFormState>;
    initial: Record<InstructorField, string>;
    submitLabel: string;
};

export function InstructorForm({ action, initial, submitLabel }: Props) {
    const { state, formAction, pending, error, props } = useFormFields(action, initial);

    return (
        <form action={formAction} className="flex max-w-3xl flex-col gap-6">
            {state.message && <FormError>{state.message}</FormError>}

            <Section title="Identité">
                <Field name="firstName" label="Prénom" error={error("firstName")}>
                    <input {...props("firstName")} type="text" required maxLength={80} autoComplete="off" />
                </Field>
                <Field name="lastName" label="Nom" error={error("lastName")}>
                    <input {...props("lastName")} type="text" required maxLength={80} autoComplete="off" />
                </Field>
            </Section>

            <Section title="Contact">
                <Field name="phone" label="Téléphone" error={error("phone")}>
                    <input {...props("phone")} type="tel" maxLength={20} autoComplete="off" />
                </Field>
                <Field name="email" label="E-mail" error={error("email")}>
                    <input {...props("email")} type="email" maxLength={120} autoComplete="off" />
                </Field>
            </Section>

            <Section title="Ce qu’il enseigne">
                <fieldset className="sm:col-span-2">
                    <legend className="sr-only">Ce qu’il enseigne</legend>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                name="teachesCode"
                                defaultChecked={(state.values?.teachesCode ?? initial.teachesCode) === "on"}
                                className="size-4 accent-brand"
                            />
                            Le code
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                name="teachesDriving"
                                defaultChecked={(state.values?.teachesDriving ?? initial.teachesDriving) === "on"}
                                className="size-4 accent-brand"
                            />
                            La conduite (leçons, examens, recyclage)
                        </label>
                    </div>
                    <p className="mt-1.5 text-xs text-muted">Le planning ne propose le moniteur que pour ce qu’il enseigne.</p>
                    {error("teachesCode") && <p className="mt-1.5 text-xs font-medium text-danger">{error("teachesCode")}</p>}
                </fieldset>
            </Section>

            <Section title="Statut">
                <Field
                    name="status"
                    label="Statut"
                    error={error("status")}
                    hint="Un moniteur inactif n’est plus proposé dans le planning. Son historique reste conservé."
                    full
                >
                    <select {...props("status")}>
                        {INSTRUCTOR_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {INSTRUCTOR_STATUS_LABELS[status]}
                            </option>
                        ))}
                    </select>
                </Field>
            </Section>

            <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={pending} className={btnPrimary}>
                    {pending ? "Enregistrement…" : submitLabel}
                </button>
                <Link href="/admin/moniteurs" className={btnSecondary}>
                    Annuler
                </Link>
            </div>
        </form>
    );
}
