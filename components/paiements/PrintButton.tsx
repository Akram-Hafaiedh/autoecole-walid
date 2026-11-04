"use client";

import { Icon } from "@/components/ui/Icon";
import { btnPrimary } from "@/lib/ui";

export function PrintButton() {
    return (
        <button type="button" onClick={() => window.print()} className={btnPrimary}>
            <Icon name="arrowRight" className="size-4" />
            Imprimer
        </button>
    );
}
