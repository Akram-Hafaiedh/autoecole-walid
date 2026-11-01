import type { LessonKindValue } from "@/lib/lessons";

// Spelled out in full so Tailwind can see every class name.
export const kindStyles: Record<LessonKindValue, { block: string; dot: string }> = {
    driving: { block: "border-brand bg-brand-soft text-brand-ink", dot: "bg-brand" },
    code: { block: "border-info-fg bg-info-bg text-info-fg", dot: "bg-info-fg" },
    exam: { block: "border-accent bg-warn-bg text-warn-fg", dot: "bg-accent" },
};
