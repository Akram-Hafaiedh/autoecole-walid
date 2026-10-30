"use client";

import { useActionState } from "react";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import { requestCode, verifyCode, type FormState } from "@/actions/auth";

const initial: FormState = { status: "idle" };

export function LoginForm() {
    const [request, requestAction, requesting] = useActionState(requestCode, initial);
    const [verify, verifyAction, verifying] = useActionState(verifyCode, initial);
    const sent = request.status === "sent";

    return (
        <div className="flex flex-col gap-6">
            <form action={requestAction} className="flex flex-col gap-3">
                <button
                    type="submit"
                    disabled={requesting}
                    className={sent ? btnSecondary : btnPrimary}
                >
                    {requesting ? "Envoi…" : sent ? "Renvoyer un code" : "Recevoir un code par e-mail"}
                </button>
                {request.message && (
                    <p
                        role="status"
                        className={
                            request.status === "error" ? "text-sm text-red-600" : "text-sm text-muted"
                        }
                    >
                        {request.message}
                    </p>
                )}
            </form>

            {sent && (
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
                        className="rounded-md border border-line bg-surface px-3 py-2.5 text-center font-mono text-xl tracking-[0.4em] tabular-nums focus-visible:outline-2 focus-visible:outline-brand"
                    />
                    <button type="submit" disabled={verifying} className={btnPrimary}>
                        {verifying ? "Vérification…" : "Se connecter"}
                    </button>
                    {verify.status === "error" && (
                        <p role="alert" className="text-sm text-red-600">
                            {verify.message}
                        </p>
                    )}
                </form>
            )}
        </div>
    );
}
