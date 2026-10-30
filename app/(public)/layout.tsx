import Link from "next/link";
import { site } from "@/lib/site";

const nav = [
  { href: "/", label: "Accueil" },
  { href: "/formules", label: "Formules" },
  { href: "/contact", label: "Contact" },
];

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {site.name}
          </Link>
          <nav aria-label="Navigation principale">
            <ul className="flex items-center gap-5 text-sm font-medium">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-muted sm:grid-cols-2 sm:px-6">
          <div>
            <p className="font-medium text-foreground">{site.name}</p>
            <p>{site.address.join(", ")}</p>
          </div>
          <div className="sm:text-right">
            <p>
              <a href={`tel:${site.phone.tel}`} className="hover:text-foreground">
                {site.phone.display}
              </a>
            </p>
            <p>{site.email}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
