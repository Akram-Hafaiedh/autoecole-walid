import type { Metadata } from "next";
import { site } from "@/lib/site";
import { btnPrimary, btnSecondary } from "@/lib/ui";

export const metadata: Metadata = {
    title: "Contact",
    description: "Adresse, téléphone, WhatsApp et horaires de l’auto-école.",
};

export default function ContactPage() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
            <p className="mt-2 max-w-xl text-muted">
                Le plus simple est de nous appeler ou de nous écrire sur WhatsApp.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
                <a href={`tel:${site.phone.tel}`} className={btnPrimary}>
                    Appeler {site.phone.display}
                </a>
                <a
                    href={`https://wa.me/${site.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btnSecondary}
                >
                    WhatsApp
                </a>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2">
                <section>
                    <h2 className="font-semibold">Adresse</h2>
                    <address className="mt-2 not-italic text-muted">
                        {site.address.map((line) => (
                            <span key={line} className="block">
                                {line}
                            </span>
                        ))}
                    </address>
                    <p className="mt-3 text-muted">{site.email}</p>
                </section>

                <section>
                    <h2 className="font-semibold">Horaires</h2>
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-muted">
                        {site.hours.map((slot) => (
                            <div key={slot.days} className="contents">
                                <dt>{slot.days}</dt>
                                <dd className="tabular-nums">{slot.time}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            </div>
        </div>
    );
}
