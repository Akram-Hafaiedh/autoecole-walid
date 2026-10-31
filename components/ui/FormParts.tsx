import { panel } from "@/lib/ui";

/** A titled panel that groups related fields in two columns. */
export function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className={`${panel} p-5 sm:p-6`}>
            <div className="mb-5">
                <h2 className="font-display text-lg font-semibold">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">{children}</div>
        </section>
    );
}

/** Label, input slot, hint and error message. The input needs id={name}. */
export function Field({
    name,
    label,
    error,
    hint,
    full,
    children,
}: {
    name: string;
    label: string;
    error?: string;
    hint?: string;
    full?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
            <label htmlFor={name} className="text-sm font-medium">
                {label}
            </label>
            {children}
            {hint && !error && <p className="text-xs text-muted">{hint}</p>}
            {error && (
                <p id={`${name}-error`} className="text-xs font-medium text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}

/** The red banner shown above a form when a submit failed. */
export function FormError({ children }: { children: React.ReactNode }) {
    return (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {children}
        </p>
    );
}
