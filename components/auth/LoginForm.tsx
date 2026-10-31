"use client";

import { useActionState } from "react";
import { requestCode, verifyCode, type FormState } from "@/actions/auth";
import { btnGhost, btnPrimary, input } from "@/lib/ui";

const initial: FormState = { status: "idle" };

export function LoginForm() {
    const [request, requestAction, requesting] = useActionState(requestCode, initial);
    const [verify, verifyAction, verifying] = useActionState(verifyCode, initial);
    const sent = request.status === "sent";

    return (
        <div className="flex flex-col gap-5">
            {request.message && (
                <p
                    role="status"
                    className={`rounded-lg px-3.5 py-2.5 text-sm ${request.status === "error"
                            ? "border border-danger/30 bg-danger/10 font-medium text-danger"
                            : "bg-brand-soft text-brand-ink"
                        }`}
                >
                    {request.message}
                </p>
            )}

            {!sent && (
                <form action={requestAction}>
                    <button type="submit" disabled={requesting} className={`${btnPrimary} w-full py-3`}>
                        {requesting ? "Envoi du code…" : "Recevoir un code par e-mail"}
                    </button>
                </form>
            )}

            {sent && (
                <>
                    <form action={verifyAction} className="flex flex-col gap-3">
                        <label htmlFor="code" className="text-sm font-medium">
                            Code à 6 chiffres
                        </label>
                        <input
                            id="code"
                            name="code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="[0-9 ]*"
                            maxLength={7}
                            required
                            autoFocus
                            aria-invalid={verify.status === "error" ? true : undefined}
                            aria-describedby={verify.status === "error" ? "code-error" : undefined}
                            className={`${input} py-3 text-center font-display text-3xl font-bold tracking-[0.4em] tabular-nums aria-invalid:border-danger`}
                        />
                        {verify.status === "error" && (
                            <p id="code-error" role="alert" className="text-sm font-medium text-danger">
                                {verify.message}
                            </p>
                        )}
                        <button type="submit" disabled={verifying} className={`${btnPrimary} w-full py-3`}>
                            {verifying ? "Vérification…" : "Se connecter"}
                        </button>
                    </form>

                    <form action={requestAction} className="text-center">
                        <button type="submit" disabled={requesting} className={btnGhost}>
                            {requesting ? "Envoi du code…" : "Renvoyer un code"}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
