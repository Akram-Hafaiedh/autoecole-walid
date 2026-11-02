"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
    { href: "/", label: "Accueil" },
    { href: "/formules", label: "Formules" },
    { href: "/contact", label: "Contact" },
];

export function PublicNav() {
    const pathname = usePathname();

    return (
        <nav aria-label="Navigation principale">
            <ul className="flex items-center gap-1 text-sm font-medium">
                {nav.map((item) => {
                    const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                aria-current={current ? "page" : undefined}
                                className={`relative rounded-lg px-3.5 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${current
                                        ? "bg-brand-soft text-brand-ink"
                                        : "text-muted hover:bg-line/60 hover:text-foreground"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
