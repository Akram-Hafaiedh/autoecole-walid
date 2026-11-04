"use client";

/** A form that asks "are you sure?" before it submits. Used for actions that cannot be undone. */
export function ConfirmForm({
    action,
    message,
    children,
}: {
    action: () => Promise<void>;
    message: string;
    children: React.ReactNode;
}) {
    return (
        <form
            action={action}
            onSubmit={(event) => {
                if (!window.confirm(message)) event.preventDefault();
            }}
        >
            {children}
        </form>
    );
}
