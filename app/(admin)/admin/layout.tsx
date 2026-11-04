import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Administration",
    robots: { index: false, follow: false },
};

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requireAdmin();

    return (
        <div className="flex flex-1 flex-col md:flex-row">
            <aside className="bg-sidebar text-sidebar-ink print:hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
                <div className="flex items-center justify-between px-4 py-4 md:px-5 md:py-6">
                    <Link href="/admin" className="rounded-md focus-visible:outline-2 focus-visible:outline-accent">
                        <Logo />
                    </Link>
                    <div className="flex items-center gap-1 md:hidden">
                        <ThemeToggle className="rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink" />
                        <form action={logout}>
                            <button
                                type="submit"
                                aria-label="Déconnexion"
                                className="rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink"
                            >
                                <Icon name="logout" />
                            </button>
                        </form>
                    </div>
                </div>

                <nav aria-label="Administration" className="overflow-x-auto px-3 pb-3 md:flex-1 md:overflow-visible md:pb-0">
                    <AdminNav />
                </nav>

                <div className="hidden flex-col gap-1 px-3 pb-4 md:flex">
                    <ThemeToggle
                        withLabel
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-ink"
                    />
                    <form action={logout}>
                        <button
                            type="submit"
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-ink"
                        >
                            <Icon name="logout" />
                            Déconnexion
                        </button>
                    </form>
                </div>
            </aside>

            <div className="min-w-0 flex-1 px-4 py-6 sm:px-8 md:px-10 md:py-10 print:p-0">
                <div className="mx-auto max-w-[88rem]">{children}</div>
            </div>
        </div>
    );
}
