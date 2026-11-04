"use client";

import Link from "next/link";
import { Field, FormError, Section } from "@/components/ui/FormParts";
import { useFormFields } from "@/components/ui/useFormFields";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import { STATUS_LABELS, STUDENT_STATUSES, type StudentField, type StudentFormState } from "@/lib/students";

type Props = {
    action: (state: StudentFormState, formData: FormData) => Promise<StudentFormState>;
    initial: Record<StudentField, string>;
    submitLabel: string;
};

export function StudentForm({ action, initial, submitLabel }: Props) {
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
                <Field name="birthDate" label="Date de naissance" error={error("birthDate")}>
                    <input {...props("birthDate")} type="date" />
                </Field>
                <Field
                    name="nationalId"
                    label="N° de carte d’identité"
                    error={error("nationalId")}
                    hint="Visible uniquement dans l’administration."
                >
                    <input {...props("nationalId")} type="text" maxLength={30} autoComplete="off" />
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

            <Section title="Dossier">
                <Field
                    name="licenceCategory"
                    label="Catégorie de permis"
                    error={error("licenceCategory")}
                    hint="Par exemple B, A, A1, C."
                >
                    <input {...props("licenceCategory")} type="text" required maxLength={4} />
                </Field>
                <Field
                    name="status"
                    label="Statut"
                    error={error("status")}
                    hint="« Archivé » retire l’élève de la liste. Le bouton Archiver de sa fiche fait la même chose."
                >
                    <select {...props("status")}>
                        {STUDENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field name="notes" label="Notes" error={error("notes")} full>
                    <textarea {...props("notes")} rows={4} maxLength={2000} />
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
