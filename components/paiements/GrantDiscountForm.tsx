"use client";

import { useActionState } from "react";
import { grantDiscount } from "@/actions/paiements";
import type { GrantDiscountState } from "@/lib/student-billing";
import { btnSecondary, input } from "@/lib/ui";

export function GrantDiscountForm({
    studentId,
    options,
}: {
    studentId: string;
    options: { id: string; label: string }[];
}) {
    const [state, formAction, pending] = useActionState(grantDiscount.bind(null, studentId), {} as GrantDiscountState);
    const problem = state.errors?.discountId;

    return (
        <form action={formAction} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="discountId" className="sr-only">
                    Remise à accorder
                </label>
                <select
                    id="discountId"
                    name="discountId"
                    defaultValue=""
                    className={`${input} max-w-xs aria-invalid:border-danger`}
                    aria-invalid={problem ? true : undefined}
                >
                    <option value="" disabled>
                        Choisir une remise…
                    </option>
                    {options.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <button type="submit" disabled={pending} className={btnSecondary}>
                    {pending ? "…" : "Accorder"}
                </button>
            </div>
            {problem && <p className="text-xs font-medium text-danger">{problem}</p>}
            {state.message && !state.errors && (
                <p role="status" className="text-sm font-medium text-ok-fg">
                    {state.message}
                </p>
            )}
            {state.message && state.errors && <p className="text-xs font-medium text-danger">{state.message}</p>}
        </form>
    );
}
