import { Pill, type PillTone } from "@/components/ui/Pill";
import { serviceText, type ServiceState } from "@/lib/cars";

const tones: Record<ServiceState["state"], PillTone> = {
    none: "neutral",
    ok: "ok",
    soon: "warn",
    overdue: "danger",
};

const labels: Record<ServiceState["state"], string> = {
    none: "À planifier",
    ok: "À jour",
    soon: "",
    overdue: "",
};

/** Entretien status: green when far away, amber when due soon, red when overdue. */
export function ServicePill({ info }: { info: ServiceState }) {
    return <Pill tone={tones[info.state]}>{labels[info.state] || serviceText(info)}</Pill>;
}
