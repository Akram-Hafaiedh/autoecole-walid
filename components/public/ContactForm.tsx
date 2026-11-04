"use client";

import { sendRequest } from "@/actions/prospects";
import { Field, FormError } from "@/components/ui/FormParts";
import { useFormFields } from "@/components/ui/useFormFields";
import { type ProspectField } from "@/lib/prospects";
import { offers } from "@/lib/site";
import { btnPrimary, panel } from "@/lib/ui";

const initial: Record<ProspectField, string> = { name: "", phone: "", email: "", interest: "", message: "", fax: "" };

export function ContactForm() {
    const { state, formAction, pending, error, props } = useFormFields(sendRequest, initial);

    if (state.sent) {
        return (
            <section role="status" className={`${panel} p-6`}>
                <h2 className="font-display text-lg font-bold tracking-tight">Merci, c’est envoyé</h2>
                <p className="mt-2 text-muted">Nous vous rappelons très vite pour répondre à votre demande.</p>
            </section>
        );
    }

    return (
        <form action={formAction} className={`${panel} flex flex-col gap-5 p-6`}>
            <div>
                <h2 className="font-display text-lg font-bold tracking-tight">Être rappelé</h2>
                <p className="mt-1 text-sm text-muted">Laissez-nous votre numéro, nous vous appelons.</p>
            </div>

            {state.message && <FormError>{state.message}</FormError>}

            <Field name="name" label="Nom et prénom" error={error("name")}>
                <input {...props("name")} type="text" required maxLength={80} autoComplete="name" />
            </Field>
            <Field name="phone" label="Téléphone" error={error("phone")}>
                <input {...props("phone")} type="tel" required maxLength={20} autoComplete="tel" />
            </Field>
            <Field name="email" label="E-mail (facultatif)" error={error("email")}>
                <input {...props("email")} type="email" maxLength={120} autoComplete="email" />
            </Field>
            <Field name="interest" label="Ce qui vous intéresse" error={error("interest")}>
                <select {...props("interest")}>
                    <option value="">Je ne sais pas encore</option>
                    {offers.map((offer) => (
                        <option key={offer.id} value={offer.id}>
                            {offer.name}
                        </option>
                    ))}
                </select>
            </Field>
            <Field name="message" label="Message (facultatif)" error={error("message")}>
                <textarea {...props("message")} rows={3} maxLength={1000} />
            </Field>

            {/* A trap for robots: people never see it, so a filled field means a robot. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="fax">Fax (ne pas remplir)</label>
                <input id="fax" name="fax" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
            </div>

            <div>
                <button type="submit" disabled={pending} className={btnPrimary}>
                    {pending ? "Envoi…" : "Envoyer ma demande"}
                </button>
            </div>
        </form>
    );
}
