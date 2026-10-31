import { Pill, type PillTone } from "@/components/ui/Pill";
import { STATUS_LABELS, type StudentStatusValue } from "@/lib/students";

const tones: Record<StudentStatusValue, PillTone> = {
    active: "ok",
    paused: "warn",
    completed: "info",
    archived: "neutral",
};

export function StatusPill({ status }: { status: StudentStatusValue }) {
    return <Pill tone={tones[status]}>{STATUS_LABELS[status]}</Pill>;
}

/** Dot colours for charts and legends. */
export const STATUS_DOT: Record<StudentStatusValue, string> = {
    active: "bg-brand",
    paused: "bg-accent",
    completed: "bg-info-fg",
    archived: "bg-muted",
};
