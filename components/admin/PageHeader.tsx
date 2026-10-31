import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

type Props = {
    title: React.ReactNode;
    /** One line under the title. */
    description?: React.ReactNode;
    /** Link back to the parent page, for example { href: "/admin/eleves", label: "Élèves" }. */
    back?: { href: string; label: string };
    /** Buttons shown on the right (below the title on small screens). */
    actions?: React.ReactNode;
    /** Shown to the left of the title, for example an avatar. */
    leading?: React.ReactNode;
};

export function PageHeader({ title, description, back, actions, leading }: Props) {
    return (
        <header className="mb-8">
            {back && (
                <Link
                    href={back.href}
                    className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
                >
                    <Icon name="chevronLeft" className="size-4" />
                    {back.label}
                </Link>
            )}
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <div className="flex min-w-0 items-center gap-4">
                    {leading}
                    <div className="min-w-0">
                        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
                        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
                    </div>
                </div>
                {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
            </div>
        </header>
    );
}
