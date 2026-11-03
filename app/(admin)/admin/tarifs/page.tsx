import type { Metadata } from "next";
import Link from "next/link";
import { toggleDiscount } from "@/actions/tarifs";
import { PageHeader } from "@/components/admin/PageHeader";
import { RatesForm } from "@/components/tarifs/RatesForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { requireAdmin } from "@/lib/auth";
import { discountAvailable } from "@/lib/billing";
import { describeDiscount } from "@/lib/discounts";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { ratesToForm } from "@/lib/rates";
import { btnGhost, btnPrimary, btnSecondary, panel } from "@/lib/ui";

export const metadata: Metadata = { title: "Tarifs et remises" };

export default async function TarifsPage() {
    await requireAdmin();

    const [rates, discounts] = await Promise.all([
        prisma.rate.findMany(),
        prisma.discount.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }, { id: "asc" }] }),
    ]);
    const today = new Date();

    return (
        <>
            <PageHeader
                title="Tarifs et remises"
                description="Le prix habituel de chaque type de leçon, et les remises que l’école propose."
            />

            <div className="grid max-w-3xl gap-10">
                <section aria-labelledby="rates-title">
                    <h2 id="rates-title" className="font-display text-xl font-semibold">
                        Tarifs habituels
                    </h2>
                    <p className="mt-1 mb-5 text-sm text-muted">
                        Une leçon est facturée quand vous la marquez « Effectuée ». Le prix est alors figé : changer un
                        tarif ne modifie jamais les leçons déjà facturées. Un prix particulier (pour un élève ou pour une
                        leçon) passe avant ces tarifs.
                    </p>
                    <RatesForm initial={ratesToForm(rates)} />
                </section>

                <section aria-labelledby="discounts-title">
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 id="discounts-title" className="font-display text-xl font-semibold">
                                Remises
                            </h2>
                            <p className="mt-1 text-sm text-muted">
                                Réseaux sociaux, fêtes, parrainage… Vous les accordez ensuite sur la fiche d’un élève.
                            </p>
                        </div>
                        <Link href="/admin/tarifs/remises/nouveau" className={btnPrimary}>
                            <Icon name="plus" className="size-4" />
                            Nouvelle remise
                        </Link>
                    </div>

                    {discounts.length === 0 ? (
                        <div className={panel}>
                            <EmptyState icon="coins">
                                Aucune remise pour l’instant. Créez-en une avec « Nouvelle remise », par exemple 10 %
                                pour les élèves venus des réseaux sociaux.
                            </EmptyState>
                        </div>
                    ) : (
                        <ul className={`${panel} divide-y divide-line`}>
                            {discounts.map((discount) => {
                                const available = discountAvailable(discount, today);
                                return (
                                    <li key={discount.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 sm:px-6">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium">
                                                {discount.name}
                                                <span className="ml-2 font-display font-bold tabular-nums">
                                                    {describeDiscount(discount.kind, discount.value)}
                                                </span>
                                            </p>
                                            {(discount.validFrom || discount.validTo) && (
                                                <p className="text-sm text-muted">
                                                    {discount.validFrom && discount.validTo
                                                        ? `Du ${formatDate(discount.validFrom, "short")} au ${formatDate(discount.validTo, "short")}`
                                                        : discount.validFrom
                                                            ? `À partir du ${formatDate(discount.validFrom, "short")}`
                                                            : `Jusqu’au ${formatDate(discount.validTo!, "short")}`}
                                                </p>
                                            )}
                                        </div>
                                        {!discount.active ? (
                                            <Pill tone="neutral">Désactivée</Pill>
                                        ) : available ? (
                                            <Pill tone="ok">Disponible</Pill>
                                        ) : (
                                            <Pill tone="warn">Hors période</Pill>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Link href={`/admin/tarifs/remises/${discount.id}`} className={btnSecondary}>
                                                Modifier
                                            </Link>
                                            <form action={toggleDiscount.bind(null, discount.id)}>
                                                <button type="submit" className={btnGhost}>
                                                    {discount.active ? "Désactiver" : "Activer"}
                                                </button>
                                            </form>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}
