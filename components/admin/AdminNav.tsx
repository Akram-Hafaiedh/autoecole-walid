"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

type Item = { label: string; icon: IconName; href?: string };

const items: Item[] = [
    { label: "Tableau de bord", icon: "home", href: "/admin" },
    { label: "Élèves", icon: "users", href: "/admin/eleves" },
    { label: "Moniteurs", icon: "user" },
    { label: "Véhicules", icon: "car" },
    { label: "Planning", icon: "calendar" },
];

const row = "relative flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium";

export function AdminNav() {
    const pathname = usePathname();

    return (
        <ul className="flex gap-1 md:flex-col">
            {items.map(({ label, icon, href }) => {
                const active = href === "/admin" ? pathname === "/admin" : !!href && pathname.startsWith(href);

                return (
                    <li key={label} className="shrink-0">
                        {href ? (
                            <Link
                                href={href}
                                aria-current={active ? "page" : undefined}
                                className={`${row} transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                                    active
                                        ? "bg-sidebar-hover text-sidebar-ink"
                                        : "text-sidebar-muted hover:bg-sidebar-hover/60 hover:text-sidebar-ink"
                                }`}
                            >
                                {active && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-1/2 left-0 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent md:block"
                                    />
                                )}
                                <Icon name={icon} />
                                {label}
                            </Link>
                        ) : (
                            <span aria-disabled="true" className={`${row} cursor-not-allowed text-sidebar-muted/50`}>
                                <Icon name={icon} />
                                {label}
                                <span className="ml-auto hidden rounded bg-sidebar-hover px-1.5 py-0.5 text-[11px] font-medium text-sidebar-muted md:inline">
                                    Bientôt
                                </span>
                            </span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
