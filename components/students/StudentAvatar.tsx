import { initials, toneIndex } from "@/lib/students";

// Spelled out in full so Tailwind can see every class name.
const tones = [
    "bg-tone-1-bg text-tone-1-fg",
    "bg-tone-2-bg text-tone-2-fg",
    "bg-tone-3-bg text-tone-3-fg",
    "bg-tone-4-bg text-tone-4-fg",
    "bg-tone-5-bg text-tone-5-fg",
    "bg-tone-6-bg text-tone-6-fg",
];

const sizes = {
    sm: "size-9 text-sm",
    lg: "size-14 text-xl",
};

type Props = {
    id: string;
    firstName: string;
    lastName: string;
    size?: keyof typeof sizes;
};

/** Initials on a soft colour. The colour is picked from the id, so it stays the same for a student. */
export function StudentAvatar({ id, firstName, lastName, size = "sm" }: Props) {
    return (
        <span
            aria-hidden="true"
            className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${sizes[size]} ${tones[toneIndex(id, tones.length)]}`}
        >
            {initials(firstName, lastName)}
        </span>
    );
}
