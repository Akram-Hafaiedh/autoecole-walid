import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { formatPrice, type Offer } from "@/lib/site";

const icons: Record<string, IconName> = {
    code: "book",
    conduite: "wheel",
    complet: "route",
};

/** One formula. `featured` marks the all-in-one offer with a green outline. */
export function OfferCard({ offer, featured = false }: { offer: Offer; featured?: boolean }) {
    return (
        <li
            className={`flex flex-col rounded-2xl border bg-surface p-6 shadow-card ${featured ? "border-2 border-brand" : "border-line"
                }`}
        >
            <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                <Icon name={icons[offer.id] ?? "book"} className="size-6" />
            </span>

            <h3 className="mt-5 font-display text-xl font-bold tracking-tight">{offer.name}</h3>
            <p className="mt-2 text-sm text-muted">{offer.summary}</p>

            <ul className="mt-5 mb-6 flex flex-col gap-2.5 text-sm">
                {offer.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                        <Icon name="check" className="mt-0.5 size-4 shrink-0 text-brand" />
                        {item}
                    </li>
                ))}
            </ul>

            <div className="mt-auto flex items-end justify-between gap-4 border-t border-line pt-5">
                <p className="font-display text-xl font-bold tabular-nums">{formatPrice(offer.price)}</p>
                <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink hover:underline"
                >
                    Nous contacter
                    <Icon name="arrowRight" className="size-4" />
                </Link>
            </div>
        </li>
    );
}
