import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice, offers } from "@/lib/site";
import { btnPrimary } from "@/lib/ui";

export const metadata: Metadata = {
    title: "Formules et tarifs",
    description: "Les formules de l’auto-école : code, conduite et forfait complet.",
};

export default function OffersPage() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-semibold tracking-tight">Formules et tarifs</h1>
            <p className="mt-2 max-w-xl text-muted">
                Choisissez la formule qui correspond à votre situation. Le détail des
                tarifs vous est communiqué à l’inscription.
            </p>

            <ul className="mt-8 grid gap-4 md:grid-cols-3">
                {offers.map((offer) => (
                    <li
                        key={offer.id}
                        className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6"
                    >
                        <h2 className="text-lg font-semibold">{offer.name}</h2>
                        <p className="text-sm text-muted">{offer.summary}</p>
                        <ul className="flex flex-col gap-1 text-sm">
                            {offer.includes.map((item) => (
                                <li key={item}>– {item}</li>
                            ))}
                        </ul>
                        <p className="mt-auto pt-4 text-lg font-semibold">
                            {formatPrice(offer.price)}
                        </p>
                    </li>
                ))}
            </ul>

            <div className="mt-10">
                <Link href="/contact" className={btnPrimary}>
                    Demander un devis
                </Link>
            </div>
        </div>
    );
}
