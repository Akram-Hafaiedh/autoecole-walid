import Link from "next/link";
import { formatPrice, offers, site } from "@/lib/site";
import { btnPrimary, btnSecondary } from "@/lib/ui";

export default function HomePage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 md:py-20">
          <p className="text-sm font-medium uppercase tracking-widest text-brand">
            Auto-école
          </p>
          <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {site.tagline}
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Préparez le code de la route et passez votre permis avec un moniteur
            qui s’adapte à votre rythme et à vos horaires.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className={btnPrimary}>
              Nous contacter
            </Link>
            <Link href="/formules" className={btnSecondary}>
              Voir les formules
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Nos formules</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5"
            >
              <h3 className="font-semibold">{offer.name}</h3>
              <p className="text-sm text-muted">{offer.summary}</p>
              <p className="mt-auto pt-3 text-sm font-medium">
                {formatPrice(offer.price)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Une question avant de vous inscrire ?
            </h2>
            <p className="text-muted">
              Appelez-nous au {site.phone.display} ou écrivez-nous sur WhatsApp.
            </p>
          </div>
          <Link href="/contact" className={btnPrimary}>
            Coordonnées et horaires
          </Link>
        </div>
      </section>
    </>
  );
}
