"use client";

import { Icon } from "@/components/ui/Icon";

/**
 * Switches between light and dark and remembers the choice in this browser.
 * The icon and label follow the theme with CSS (see the `dark` variant in globals.css), so the
 * button needs no state and cannot flash the wrong icon.
 */
export function ThemeToggle({
    className = "",
    withLabel = false,
}: {
    className?: string;
    withLabel?: boolean;
}) {
    function toggle() {
        const root = document.documentElement;
        const next = root.dataset.theme === "dark" ? "light" : "dark";
        // Pause colour transitions for the instant of the switch, so everything changes together.
        root.dataset.switching = "";
        root.dataset.theme = next;
        requestAnimationFrame(() => requestAnimationFrame(() => delete root.dataset.switching));
        try {
            localStorage.setItem("theme", next);
        } catch {
            // Private window or blocked storage: the theme still changes for this visit.
        }
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label="Changer de thème, clair ou sombre"
            className={className}
        >
            <Icon name="moon" className="size-5 dark:hidden" />
            <Icon name="sun" className="hidden size-5 dark:block" />
            {withLabel && (
                <>
                    <span className="dark:hidden">Mode sombre</span>
                    <span className="hidden dark:inline">Mode clair</span>
                </>
            )}
        </button>
    );
}
