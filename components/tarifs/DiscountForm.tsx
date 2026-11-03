"use client";

import Link from "next/link";
import { Field, FormError, Section } from "@/components/ui/FormParts";
import { useFormFields } from "@/components/ui/useFormFields";
import { DISCOUNT_KINDS, DISCOUNT_KIND_LABELS, type DiscountField, type DiscountFormState } from "@/lib/discounts";
import { site } from "@/lib/site";
import { btnPrimary, btnSecondary } from "@/lib/ui";

type Props = {
    action: (state: DiscountFormState, formData: FormData) => Promise<DiscountFormState>;
    initial: Record<DiscountField, string>;
    submitLabel: string;
};

export function DiscountForm({ action, initial, submitLabel }: Props) {
    const { state, formAction, pending, error, props } = useFormFields(action, initial);

    return (
        <form action={formAction} className="flex max-w-3xl flex-col gap-6">
            {state.message && <FormError>{state.message}</FormError>}

            <Section title="Remise">
                <Field name="name" label="Nom" error={error("name")} hint="Par exemple « Réseaux sociaux » ou « Fêtes ».">
                    <input {...props("name")} type="text" required maxLength={60} autoComplete="off" />
                </Field>
                <Field name="status" label="Statut" error={error("status")} hint="Une remise désactivée ne peut plus être accordée.">
                    <select {...props("status")}>
                        <option value="active">Active</option>
                        <option value="inactive">Désactivée</option>
                    </select>
                </Field>
                <Field name="kind" label="Type" error={error("kind")}>
                    <select {...props("kind")}>
                        {DISCOUNT_KINDS.map((kind) => (
                            <option key={kind} value={kind}>
                                {DISCOUNT_KIND_LABELS[kind]}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field
                    name="value"
                    label="Valeur"
                    error={error("value")}
                    hint={`Un pourcentage (10 pour 10 %), ou un montant en ${site.currency}.`}
                >
                    <input {...props("value")} type="text" inputMode="decimal" required autoComplete="off" maxLength={12} />
                </Field>
            </Section>

            <Section
                title="Période (facultatif)"
                description="Pour une offre de fêtes ou de vacances. Sans dates, la remise est toujours disponible."
            >
                <Field name="validFrom" label="Du" error={error("validFrom")}>
                    <input {...props("validFrom")} type="date" />
                </Field>
                <Field name="validTo" label="Au (inclus)" error={error("validTo")}>
                    <input {...props("validTo")} type="date" />
                </Field>
            </Section>

            <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={pending} className={btnPrimary}>
                    {pending ? "Enregistrement…" : submitLabel}
                </button>
                <Link href="/admin/tarifs" className={btnSecondary}>
                    Annuler
                </Link>
            </div>
        </form>
    );
}
