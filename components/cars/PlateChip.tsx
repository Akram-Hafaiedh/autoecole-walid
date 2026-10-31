/** An immatriculation drawn like a small number plate. */
export function PlateChip({ plate }: { plate: string }) {
    return (
        <span className="inline-flex items-center rounded-md border-2 border-foreground/70 bg-surface px-2 py-0.5 font-mono text-xs font-semibold tracking-wider whitespace-nowrap">
            {plate}
        </span>
    );
}
