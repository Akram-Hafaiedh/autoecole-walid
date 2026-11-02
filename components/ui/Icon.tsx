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
    sun: (
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </>
    ),
    moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
    arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    phone: (
        <path d="M6.6 3.5h2.7l1.4 4-1.8 1.3a11 11 0 0 0 5.8 5.8l1.3-1.8 4 1.4v2.7a2 2 0 0 1-2.1 2A15.5 15.5 0 0 1 4.6 5.6 2 2 0 0 1 6.6 3.5z" />
    ),
    chat: (
        <>
            <path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.6A7.5 7.5 0 1 1 20 11.5z" />
        </>
    ),
    mail: (
        <>
            <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
            <path d="m4 7.5 8 6 8-6" />
        </>
    ),
    pin: (
        <>
            <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z" />
            <circle cx="12" cy="10" r="2.3" />
        </>
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
        </>
    ),
    book: (
        <>
            <path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v12H8.5A3.5 3.5 0 0 1 5 16.5z" />
            <path d="M5 16.5A3.5 3.5 0 0 1 8.5 13H19" />
        </>
    ),
    wheel: (
        <>
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="12" cy="12" r="2" />
            <path d="M12 14v6.5M10.2 11 3.8 9.5M13.8 11l6.4-1.5" />
        </>
    ),
    route: (
        <>
            <circle cx="6" cy="18" r="2" />
            <circle cx="18" cy="6" r="2" />
            <path d="M8 18h6.5a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7H16" />
        </>
    ),
    shield: (
        <>
            <path d="M12 3.5 5 6v5.5c0 4.4 2.9 7.6 7 9 4.1-1.4 7-4.6 7-9V6z" />
            <path d="m9 12 2.2 2.2L15.5 10" />
        </>
    ),
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
