import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { OfferCard } from "@/components/public/OfferCard";
import { offers, site } from "@/lib/site";
import { btnSecondary } from "@/lib/ui";

const steps: { title: string; text: string }[] = [
  {
    title: "Inscription",
    text: "Contactez-nous ou passez à l’auto-école. Nous vous expliquons les démarches et ouvrons votre dossier.",
  },
  {
    title: "Code de la route",
    text: "Cours et séries d’entraînement pour préparer l’examen du code, à votre rythme.",
  },
  {
    title: "Conduite et permis",
    text: "Leçons avec votre moniteur sur un véhicule de l’école, jusqu’au jour de l’examen.",
  },
];

const strengths: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "user",
    title: "Un moniteur dédié",
    text: "Vous apprenez avec un moniteur qui connaît votre niveau et suit votre progression.",
  },
  {
    icon: "calendar",
    title: "Un planning à votre mesure",
    text: "Les leçons s’adaptent à vos horaires, que vous travailliez ou étudiiez.",
  },
  {
    icon: "car",
    title: "Les véhicules de l’école",
    text: "Vous conduisez sur les véhicules de l’auto-école, entretenus et suivis.",
  },
];

const heroButton =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ink";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-sidebar text-sidebar-ink">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-20 sm:px-6 md:pt-20 md:pb-24 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-sidebar-hover px-3 py-1.5 text-xs font-semibold tracking-widest text-sidebar-muted uppercase">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              Auto-école
            </p>
            <h1 className="mt-6 max-w-2xl font-display text-5xl leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl">
              {site.tagline}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-sidebar-muted">
              Préparez le code de la route et passez votre permis avec un moniteur
              qui s’adapte à votre rythme et à vos horaires.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={`tel:${site.phone.tel}`} className={`${heroButton} bg-sidebar-ink text-sidebar hover:bg-white`}>
                <Icon name="phone" className="size-4" />
                Nous appeler
              </a>
              <Link
                href="/formules"
                className={`${heroButton} border border-sidebar-muted/50 text-sidebar-ink hover:bg-sidebar-hover`}
              >
                Voir les formules
                <Icon name="arrowRight" className="size-4" />
              </Link>
            </div>
          </div>

          <aside
            aria-label="Horaires et contact"
            className="rounded-2xl border border-sidebar-hover bg-sidebar-hover/60 p-6 sm:p-7"
          >
            <h2 className="flex items-center gap-2 font-display text-sm font-bold tracking-wide uppercase">
              <Icon name="clock" className="size-4 text-accent" />
              Horaires d’ouverture
            </h2>
            <dl className="mt-5 flex flex-col divide-y divide-sidebar-hover">
              {site.hours.map((slot) => (
                <div key={slot.days} className="flex justify-between gap-4 py-3 text-sm first:pt-0">
                  <dt className="text-sidebar-muted">{slot.days}</dt>
                  <dd className="font-medium tabular-nums">{slot.time}</dd>
                </div>
              ))}
            </dl>
            <a
              href={`tel:${site.phone.tel}`}
              className="mt-2 block font-display text-2xl font-bold tracking-tight tabular-nums hover:underline"
            >
              {site.phone.display}
            </a>
            <p className="mt-1 text-sm text-sidebar-muted">{site.address.join(", ")}</p>
          </aside>
        </div>
        <div className="absolute inset-x-0 bottom-6">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <span aria-hidden="true" className="road-line-x block opacity-90" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <p className="text-sm font-semibold tracking-widest text-brand-ink uppercase">Le parcours</p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Du premier appel au permis, en trois étapes
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="relative flex flex-col gap-3 md:pr-6">
              <span className="grid size-12 place-items-center rounded-full bg-brand font-display text-xl font-bold text-brand-contrast">
                {index + 1}
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-6 left-16 hidden h-px w-[calc(100%-5rem)] border-t-2 border-dashed border-line-strong md:block"
                />
              )}
              <h3 className="mt-2 font-display text-xl font-bold tracking-tight">{step.title}</h3>
              <p className="text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <p className="text-sm font-semibold tracking-widest text-brand-ink uppercase">Nos formules</p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Choisissez ce qui correspond à votre situation
          </h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} featured={offer.id === "complet"} />
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <ul className="grid gap-8 md:grid-cols-3">
          {strengths.map((item) => (
            <li key={item.title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                <Icon name={item.icon} className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold tracking-tight">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
        <div className="flex flex-col gap-6 rounded-3xl bg-brand-soft p-8 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
              Une question avant de vous inscrire ?
            </h2>
            <p className="mt-2 max-w-lg text-brand-ink/80">
              Appelez-nous au {site.phone.display} ou écrivez-nous sur WhatsApp, nous vous répondons avec plaisir.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-medium text-brand-contrast transition-colors hover:bg-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Coordonnées et horaires
              <Icon name="arrowRight" className="size-4" />
            </Link>
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className={btnSecondary}
            >
              <Icon name="chat" className="size-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
