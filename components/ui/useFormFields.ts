import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import { input } from "@/lib/ui";

/**
 * The plumbing every admin form shares: the action state, plus a helper that gives each input
 * its id, name, current value, error styling and aria attributes.
 */
export function useFormFields<Field extends string>(
    action: (state: FormState<Field>, formData: FormData) => Promise<FormState<Field>>,
    initial: Record<Field, string>,
) {
    const [state, formAction, pending] = useActionState(action, {} as FormState<Field>);
    const error = (field: Field) => state.errors?.[field];

    const props = (name: Field) => ({
        id: name,
        name,
        // After a failed submit, show what the user typed rather than the saved value.
        defaultValue: state.values?.[name] ?? initial[name],
        className: `${input} aria-invalid:border-danger`,
        "aria-invalid": error(name) ? true : undefined,
        "aria-describedby": error(name) ? `${name}-error` : undefined,
    });

    return { state, formAction, pending, error, props };
}
