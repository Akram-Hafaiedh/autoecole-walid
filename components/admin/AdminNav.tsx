"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
    { label: "Tableau de bord", href: "/admin" },
    { label: "Élèves", href: "/admin/eleves" },
    { label: "Moniteurs" },
    { label: "Véhicules" },
    { label: "Planning" },
];

export function AdminNav() {
    const pathname = usePathname();

    return (
        <>
            {items.map(({ label, href }) => {
                const active = href === "/admin" ? pathname === "/admin" : !!href && pathname.startsWith(href);
                return (
                    <li key={label} className="shrink-0">
                        {href ? (
                            <Link
                                href={href}
                                aria-current={active ? "page" : undefined}
                                className={`block rounded-md px-3 py-1.5 ${active ? "bg-line/60 font-medium" : "text-muted hover:bg-line/40 hover:text-foreground"
                                    }`}
                            >
                                {label}
                            </Link>
                        ) : (
                            <span
                                className="block cursor-not-allowed rounded-md px-3 py-1.5 text-muted"
                                title="Bientôt disponible"
                            >
                                {label}
                            </span>
                        )}
                    </li>
                );
            })}
        </>
    );
}
