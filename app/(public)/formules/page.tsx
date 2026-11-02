import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { OfferCard } from "@/components/public/OfferCard";
import { PageIntro } from "@/components/public/PageIntro";
import { offers, site } from "@/lib/site";
import { btnPrimary, btnSecondary } from "@/lib/ui";

export const metadata: Metadata = {
    title: "Formules et tarifs",
    description: "Les formules de l’auto-école : code, conduite et forfait complet.",
};

export default function OffersPage() {
    return (
        <>
            <PageIntro eyebrow="Formules et tarifs" title="Trouvez la formule qui vous convient">
                Choisissez la formule qui correspond à votre situation. Le détail des
                tarifs vous est communiqué à l’inscription.
            </PageIntro>

            <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
                <ul className="grid gap-5 md:grid-cols-3">
                    {offers.map((offer) => (
                        <OfferCard key={offer.id} offer={offer} featured={offer.id === "complet"} />
                    ))}
                </ul>

                <div className="mt-12 flex flex-col gap-5 rounded-3xl bg-brand-soft p-8 sm:p-10 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="font-display text-2xl font-bold tracking-tight text-brand-ink">
                            Besoin d’un devis ?
                        </h2>
                        <p className="mt-2 text-brand-ink/80">
                            Dites-nous où vous en êtes, nous vous conseillons la formule adaptée.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/contact" className={btnPrimary}>
                            Demander un devis
                            <Icon name="arrowRight" className="size-4" />
                        </Link>
                        <a href={`tel:${site.phone.tel}`} className={btnSecondary}>
                            <Icon name="phone" className="size-4" />
                            {site.phone.display}
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
