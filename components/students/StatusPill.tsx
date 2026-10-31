import { STATUS_LABELS, type StudentStatusValue } from "@/lib/students";

// Road-sign meaning: green = in progress, amber = on hold, blue = finished, grey = archived.
const styles: Record<StudentStatusValue, string> = {
    active: "bg-ok-bg text-ok-fg",
    paused: "bg-warn-bg text-warn-fg",
    completed: "bg-info-bg text-info-fg",
    archived: "bg-neutral-bg text-neutral-fg",
};

export function StatusPill({ status }: { status: StudentStatusValue }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
        >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {STATUS_LABELS[status]}
        </span>
    );
}

/** Dot colours for charts and legends. */
export const STATUS_DOT: Record<StudentStatusValue, string> = {
    active: "bg-brand",
    paused: "bg-accent",
    completed: "bg-info-fg",
    archived: "bg-muted",
};
