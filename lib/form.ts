// The shape every admin form uses to talk to its server action.

export type FormState<Field extends string> = {
    errors?: Partial<Record<Field, string>>;
    /** A message for the whole form, for example "Corrigez les champs en rouge." */
    message?: string;
    /** What the user typed, so a failed submit does not wipe the form. */
    values?: Partial<Record<Field, string>>;
};

/** Reads the named fields from a submitted form as trimmed text. */
export function readFields<Field extends string>(
    formData: FormData,
    fields: readonly Field[],
): Record<Field, string> {
    const values = {} as Record<Field, string>;
    for (const field of fields) values[field] = String(formData.get(field) ?? "").trim();
    return values;
}
