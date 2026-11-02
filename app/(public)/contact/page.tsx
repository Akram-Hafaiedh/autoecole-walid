import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageIntro } from "@/components/public/PageIntro";
import { site } from "@/lib/site";
import { panel } from "@/lib/ui";

export const metadata: Metadata = {
    title: "Contact",
    description: "Adresse, téléphone, WhatsApp et horaires de l’auto-école.",
};

const ways: { icon: IconName; label: string; value: string; href: string; external?: boolean }[] = [
    { icon: "phone", label: "Téléphone", value: site.phone.display, href: `tel:${site.phone.tel}` },
    { icon: "chat", label: "WhatsApp", value: "Écrire un message", href: `https://wa.me/${site.whatsapp}`, external: true },
    { icon: "mail", label: "E-mail", value: site.email, href: `mailto:${site.email}` },
];

export default function ContactPage() {
    const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address.join(", "))}`;

    return (
        <>
            <PageIntro eyebrow="Contact" title="Parlons de votre permis">
                Le plus simple est de nous appeler ou de nous écrire sur WhatsApp.
            </PageIntro>

            <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.2fr_1fr]">
                <ul className="flex flex-col gap-4">
                    {ways.map((way) => (
                        <li key={way.label}>
                            <a
                                href={way.href}
                                {...(way.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                className={`${panel} group flex items-center gap-4 p-5 transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
                            >
                                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                                    <Icon name={way.icon} className="size-6" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm text-muted">{way.label}</span>
                                    <span className="block truncate font-display text-xl font-bold tracking-tight">
                                        {way.value}
                                    </span>
                                </span>
                                <Icon
                                    name="arrowRight"
                                    className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                                />
                            </a>
                        </li>
                    ))}
                </ul>

                <div className="flex flex-col gap-6">
                    <section className={`${panel} p-6`}>
                        <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
                            <Icon name="clock" className="size-5 text-brand" />
                            Horaires
                        </h2>
                        <dl className="mt-4 flex flex-col divide-y divide-line">
                            {site.hours.map((slot) => (
                                <div key={slot.days} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0">
                                    <dt className="text-muted">{slot.days}</dt>
                                    <dd className="font-medium tabular-nums">{slot.time}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section className={`${panel} p-6`}>
                        <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
                            <Icon name="pin" className="size-5 text-brand" />
                            Adresse
                        </h2>
                        <address className="mt-4 not-italic text-muted">
                            {site.address.map((line) => (
                                <span key={line} className="block">
                                    {line}
                                </span>
                            ))}
                        </address>
                        <a
                            href={mapsHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink hover:underline"
                        >
                            Voir l’itinéraire
                            <Icon name="arrowRight" className="size-4" />
                        </a>
                    </section>
                </div>
            </section>
        </>
    );
}
