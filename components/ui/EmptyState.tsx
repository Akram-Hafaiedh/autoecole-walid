import { Icon, type IconName } from "@/components/ui/Icon";

type Props = {
    icon: IconName;
    children: React.ReactNode;
    /** A button or link shown under the text. */
    action?: React.ReactNode;
};

export function EmptyState({ icon, children, action }: Props) {
    return (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-surface-2 text-muted">
                <Icon name={icon} className="size-6" />
            </span>
            <p className="max-w-sm text-sm text-muted">{children}</p>
            {action}
        </div>
    );
}
