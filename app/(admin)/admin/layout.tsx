import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { site } from "@/lib/site";

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
            <aside className="border-b border-line bg-surface md:w-56 md:border-b-0 md:border-r">
                <div className="px-4 py-4 sm:px-6 md:px-4">
                    <Link href="/admin" className="font-semibold tracking-tight">
                        {site.name}
                    </Link>
                    <p className="text-xs text-muted">Administration</p>
                </div>
                <ul className="flex gap-1 overflow-x-auto px-4 pb-3 text-sm sm:px-6 md:flex-col md:px-2 md:pb-4">
                    <AdminNav />
                    <li className="shrink-0 md:mt-4">
                        <form action={logout}>
                            <button
                                type="submit"
                                className="block w-full rounded-md px-3 py-1.5 text-left text-muted hover:bg-line/40 hover:text-foreground"
                            >
                                Déconnexion
                            </button>
                        </form>
                    </li>
                </ul>
            </aside>
            <div className="min-w-0 flex-1 px-4 py-8 sm:px-6">{children}</div>
        </div>
    );
}