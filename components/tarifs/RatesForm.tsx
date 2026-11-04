"use client";

import { saveRates } from "@/actions/tarifs";
import { Field, FormError } from "@/components/ui/FormParts";
import { useFormFields } from "@/components/ui/useFormFields";
import { PRICE_MODES, PRICE_MODE_LABELS } from "@/lib/billing";
import { KIND_LABELS, LESSON_KINDS } from "@/lib/lessons";
import { type RateField } from "@/lib/rates";
import { site } from "@/lib/site";
import { btnPrimary, panel } from "@/lib/ui";

const KIND_HINTS = {
    driving: "Leçons de conduite avec un moniteur et un véhicule.",
    code: "Cours et séries de code.",
    exam: "Accompagnement le jour de l’examen.",
    refresher: "Remise à niveau pour quelqu’un qui a déjà son permis mais n’a pas conduit depuis longtemps.",
} as const;

export function RatesForm({ initial }: { initial: Record<RateField, string> }) {
    const { state, formAction, pending, error, props } = useFormFields(saveRates, initial);
    const saved = state.message && !state.errors;

    return (
        <form action={formAction} className="flex flex-col gap-6">
            {state.message &&
                (saved ? (
                    <p role="status" className="rounded-xl bg-ok-bg px-4 py-3 text-sm font-medium text-ok-fg">
                        {state.message}
                    </p>
                ) : (
                    <FormError>{state.message}</FormError>
                ))}

            {LESSON_KINDS.map((kind) => (
                <section key={kind} className={`${panel} p-5 sm:p-6`}>
                    <h3 className="font-display text-lg font-semibold">{KIND_LABELS[kind]}</h3>
                    <p className="mt-0.5 mb-5 text-sm text-muted">{KIND_HINTS[kind]}</p>
                    <div className="grid gap-5 sm:grid-cols-3">
                        <Field name={`${kind}Mode`} label="Facturation" error={error(`${kind}Mode`)}>
                            <select {...props(`${kind}Mode`)}>
                                {PRICE_MODES.map((mode) => (
                                    <option key={mode} value={mode}>
                                        {PRICE_MODE_LABELS[mode][0].toUpperCase() + PRICE_MODE_LABELS[mode].slice(1)}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field
                            name={`${kind}Amount`}
                            label={`Tarif (${site.currency})`}
                            error={error(`${kind}Amount`)}
                            hint="Laissez vide s’il n’y a pas de tarif."
                        >
                            <input {...props(`${kind}Amount`)} type="text" inputMode="decimal" autoComplete="off" maxLength={12} />
                        </Field>
                        <Field
                            name={`${kind}Fee`}
                            label={`Frais d’absence (${site.currency})`}
                            error={error(`${kind}Fee`)}
                            hint="Vide : l’élève absent ne paie rien."
                        >
                            <input {...props(`${kind}Fee`)} type="text" inputMode="decimal" autoComplete="off" maxLength={12} />
                        </Field>
                    </div>
                </section>
            ))}

            <div>
                <button type="submit" disabled={pending} className={btnPrimary}>
                    {pending ? "Enregistrement…" : "Enregistrer les tarifs"}
                </button>
            </div>
        </form>
    );
}
