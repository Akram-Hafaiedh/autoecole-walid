// Small stroke icons, drawn on a 24px grid. Decorative: the label next to them carries the meaning.

const paths = {
    home: (
        <>
            <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </>
    ),
    users: (
        <>
            <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
            <circle cx="10" cy="8" r="3.5" />
            <path d="M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35" />
            <path d="M15.5 4.65a3.5 3.5 0 0 1 0 6.7" />
        </>
    ),
    user: (
        <>
            <path d="M19 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-7A3.5 3.5 0 0 0 5 18.5V20" />
            <circle cx="12" cy="8" r="3.5" />
        </>
    ),
    car: (
        <>
            <path d="M3 14.5 4.7 9.3A2 2 0 0 1 6.6 8h10.8a2 2 0 0 1 1.9 1.3L21 14.5V18a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1.5h-11V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
            <circle cx="7.5" cy="13.5" r="0.9" />
            <circle cx="16.5" cy="13.5" r="0.9" />
        </>
    ),
    calendar: (
        <>
            <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
            <path d="M3.5 10h17M8 3v4M16 3v4" />
        </>
    ),
    search: (
        <>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-3.9-3.9" />
        </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    logout: (
        <>
            <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
            <path d="m16 16 4-4-4-4M20 12H9" />
        </>
    ),
    chevronRight: <path d="m9 6 6 6-6 6" />,
    chevronLeft: <path d="m15 6-6 6 6 6" />,
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            {paths[name]}
        </svg>
    );
}
