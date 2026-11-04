"use client";

import { useEffect, useRef } from "react";
import { addPayment } from "@/actions/paiements";
import { Field, FormError } from "@/components/ui/FormParts";
import { useFormFields } from "@/components/ui/useFormFields";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentField } from "@/lib/student-billing";
import { site } from "@/lib/site";
import { btnPrimary } from "@/lib/ui";

export function PaymentForm({ studentId, initial }: { studentId: string; initial: Record<PaymentField, string> }) {
    const { state, formAction, pending, error, props } = useFormFields(addPayment.bind(null, studentId), initial);
    const saved = Boolean(state.message && !state.errors);
    const form = useRef<HTMLFormElement>(null);

    // After a saved payment the fields go back to their starting values, ready for the next one.
    useEffect(() => {
        if (saved) form.current?.reset();
    }, [state, saved]);

    return (
        <form ref={form} action={formAction} className="flex flex-col gap-5">
            {state.message &&
                (saved ? (
                    <p role="status" className="rounded-xl bg-ok-bg px-4 py-3 text-sm font-medium text-ok-fg">
                        {state.message}
                    </p>
                ) : (
                    <FormError>{state.message}</FormError>
                ))}

            <div className="grid gap-5 sm:grid-cols-2">
                <Field name="amount" label={`Montant reçu (${site.currency})`} error={error("amount")}>
                    <input {...props("amount")} type="text" inputMode="decimal" required autoComplete="off" maxLength={12} />
                </Field>
                <Field name="paidOn" label="Date" error={error("paidOn")}>
                    <input {...props("paidOn")} type="date" required />
                </Field>
                <Field name="method" label="Mode de paiement" error={error("method")}>
                    <select {...props("method")}>
                        {PAYMENT_METHODS.map((method) => (
                            <option key={method} value={method}>
                                {PAYMENT_METHOD_LABELS[method]}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field name="note" label="Note" error={error("note")} hint="Facultatif : n° de chèque, tranche…">
                    <input {...props("note")} type="text" autoComplete="off" maxLength={300} />
                </Field>
            </div>

            <div>
                <button type="submit" disabled={pending} className={btnPrimary}>
                    {pending ? "Enregistrement…" : "Enregistrer le paiement"}
                </button>
            </div>
        </form>
    );
}
