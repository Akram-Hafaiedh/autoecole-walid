import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PublicNav } from "@/components/public/PublicNav";
import { site } from "@/lib/site";
import { btnPrimary } from "@/lib/ui";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Aller au contenu
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/" aria-label={`${site.name}, accueil`} className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
            <Logo />
          </Link>

          <div className="order-3 -mx-1 w-full md:order-none md:mx-0 md:w-auto">
            <PublicNav />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle className="grid size-10 place-items-center rounded-lg text-muted transition-colors hover:bg-line/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" />
            <a href={`tel:${site.phone.tel}`} className={btnPrimary}>
              <Icon name="phone" className="size-4" />
              <span className="max-sm:sr-only">{site.phone.display}</span>
              <span className="sm:hidden" aria-hidden="true">Appeler</span>
            </a>
          </div>
        </div>
      </header>

      <main id="contenu" className="flex-1">
        {children}
      </main>

      <footer className="bg-sidebar text-sidebar-ink">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-sidebar-muted">{site.tagline}</p>
          </div>

          <div>
            <h2 className="font-display text-sm font-bold tracking-wide text-sidebar-ink uppercase">Nous joindre</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-sidebar-muted">
              <li>
                <a href={`tel:${site.phone.tel}`} className="inline-flex items-center gap-2 hover:text-sidebar-ink">
                  <Icon name="phone" className="size-4" />
                  {site.phone.display}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 hover:text-sidebar-ink">
                  <Icon name="mail" className="size-4" />
                  {site.email}
                </a>
              </li>
              <li className="inline-flex items-start gap-2">
                <Icon name="pin" className="mt-0.5 size-4 shrink-0" />
                <span>{site.address.join(", ")}</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-bold tracking-wide text-sidebar-ink uppercase">Horaires</h2>
            <dl className="mt-4 flex flex-col gap-2 text-sm text-sidebar-muted">
              {site.hours.map((slot) => (
                <div key={slot.days} className="flex justify-between gap-4">
                  <dt>{slot.days}</dt>
                  <dd className="text-sidebar-ink tabular-nums">{slot.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="border-t border-sidebar-hover">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-sidebar-muted sm:px-6">
            <p>© {new Date().getFullYear()} {site.name}</p>
            <Link href="/connexion" className="hover:text-sidebar-ink">
              Espace équipe
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
