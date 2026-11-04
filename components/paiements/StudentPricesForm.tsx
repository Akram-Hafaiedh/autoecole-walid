"use client";

import { useState } from "react";
import { saveStudentPrices } from "@/actions/paiements";
import { Field, FormError } from "@/components/ui/FormParts";
import { useFormFields } from "@/components/ui/useFormFields";
import { type StudentPriceField } from "@/lib/student-billing";
import { PRICE_MODES, PRICE_MODE_LABELS } from "@/lib/billing";
import { KIND_LABELS, LESSON_KINDS } from "@/lib/lessons";
import { site } from "@/lib/site";
import { btnPrimary, panel } from "@/lib/ui";

export function StudentPricesForm({
    studentId,
    initial,
}: {
    studentId: string;
    initial: Record<StudentPriceField, string>;
}) {
    const { state, formAction, pending, error, props } = useFormFields(saveStudentPrices.bind(null, studentId), initial);
    const saved = state.message && !state.errors;
    const [hasPackage, setHasPackage] = useState(initial.packageTotal !== "");

    return (
        <form action={formAction} className={`${panel} flex flex-col gap-6 p-5 sm:p-6`}>
            {state.message &&
                (saved ? (
                    <p role="status" className="rounded-xl bg-ok-bg px-4 py-3 text-sm font-medium text-ok-fg">
                        {state.message}
                    </p>
                ) : (
                    <FormError>{state.message}</FormError>
                ))}

            <div className="grid gap-5 sm:grid-cols-2">
                <Field
                    name="packageTotal"
                    label={`Prix total convenu (${site.currency})`}
                    error={error("packageTotal")}
                    hint="Un forfait pour tout le permis. Ses leçons sont alors incluses. Vide : l’élève paie leçon par leçon."
                >
                    <input
                        {...props("packageTotal")}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        maxLength={12}
                        onChange={(event) => setHasPackage(event.target.value.trim() !== "")}
                    />
                </Field>
            </div>

            <div>
                <h3 className="font-display text-base font-semibold">Prix par type de leçon</h3>
                <p className="mt-0.5 mb-4 text-sm text-muted">
                    {hasPackage
                        ? "Avec un prix total, les leçons sont incluses : ces prix ne servent que si vous retirez le forfait."
                        : "Laissez vide pour appliquer le tarif habituel de l’école."}
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                    {LESSON_KINDS.map((kind) => (
                        <div key={kind} className="grid grid-cols-2 gap-3 rounded-xl border border-line p-4">
                            <p className="col-span-2 text-sm font-semibold">{KIND_LABELS[kind]}</p>
                            <Field name={`${kind}Mode`} label="Facturation" error={error(`${kind}Mode`)}>
                                <select {...props(`${kind}Mode`)}>
                                    {PRICE_MODES.map((mode) => (
                                        <option key={mode} value={mode}>
                                            {PRICE_MODE_LABELS[mode][0].toUpperCase() + PRICE_MODE_LABELS[mode].slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field name={`${kind}Amount`} label={`Prix (${site.currency})`} error={error(`${kind}Amount`)}>
                                <input {...props(`${kind}Amount`)} type="text" inputMode="decimal" autoComplete="off" maxLength={12} />
                            </Field>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <button type="submit" disabled={pending} className={btnPrimary}>
                    {pending ? "Enregistrement…" : "Enregistrer les prix"}
                </button>
            </div>
        </form>
    );
}
