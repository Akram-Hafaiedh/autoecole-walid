"use client";

import Link from "next/link";
import { Field, FormError, Section } from "@/components/ui/FormParts";
import { useFormFields } from "@/components/ui/useFormFields";
import {
    CAR_STATUSES,
    CAR_STATUS_LABELS,
    TRANSMISSIONS,
    TRANSMISSION_LABELS,
    type CarField,
    type CarFormState,
} from "@/lib/cars";
import { btnPrimary, btnSecondary } from "@/lib/ui";

type Props = {
    action: (state: CarFormState, formData: FormData) => Promise<CarFormState>;
    initial: Record<CarField, string>;
    submitLabel: string;
};

export function CarForm({ action, initial, submitLabel }: Props) {
    const { state, formAction, pending, error, props } = useFormFields(action, initial);

    return (
        <form action={formAction} className="flex max-w-3xl flex-col gap-6">
            {state.message && <FormError>{state.message}</FormError>}

            <Section title="Véhicule">
                <Field name="label" label="Nom" error={error("label")} hint="Par exemple « Clio blanche ».">
                    <input {...props("label")} type="text" required maxLength={60} autoComplete="off" />
                </Field>
                <Field
                    name="plate"
                    label="Immatriculation"
                    error={error("plate")}
                    hint="Chaque véhicule a une immatriculation unique."
                >
                    <input {...props("plate")} type="text" required maxLength={20} autoComplete="off" />
                </Field>
                <Field name="transmission" label="Boîte de vitesses" error={error("transmission")}>
                    <select {...props("transmission")}>
                        {TRANSMISSIONS.map((value) => (
                            <option key={value} value={value}>
                                {TRANSMISSION_LABELS[value]}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field
                    name="status"
                    label="Statut"
                    error={error("status")}
                    hint="Un véhicule hors service n’est plus proposé dans le planning."
                >
                    <select {...props("status")}>
                        {CAR_STATUSES.map((value) => (
                            <option key={value} value={value}>
                                {CAR_STATUS_LABELS[value]}
                            </option>
                        ))}
                    </select>
                </Field>
            </Section>

            <Section title="Suivi">
                <Field
                    name="nextServiceDate"
                    label="Prochain entretien"
                    error={error("nextServiceDate")}
                    hint="Vous serez prévenu sur le tableau de bord 30 jours avant."
                >
                    <input {...props("nextServiceDate")} type="date" />
                </Field>
                <Field name="notes" label="Notes" error={error("notes")} full>
                    <textarea {...props("notes")} rows={4} maxLength={2000} />
                </Field>
            </Section>

            <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={pending} className={btnPrimary}>
                    {pending ? "Enregistrement…" : submitLabel}
                </button>
                <Link href="/admin/vehicules" className={btnSecondary}>
                    Annuler
                </Link>
            </div>
        </form>
    );
}
