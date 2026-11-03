import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateDiscount } from "@/actions/tarifs";
import { PageHeader } from "@/components/admin/PageHeader";
import { DiscountForm } from "@/components/tarifs/DiscountForm";
import { requireAdmin } from "@/lib/auth";
import { discountValueInput } from "@/lib/discounts";
import { isUuid, toDateInput } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Modifier la remise" };

export default async function EditDiscountPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();

    const { id } = await params;
    if (!isUuid(id)) notFound();

    const discount = await prisma.discount.findUnique({ where: { id } });
    if (!discount) notFound();

    return (
        <>
            <PageHeader
                back={{ href: "/admin/tarifs", label: "Tarifs et remises" }}
                title={discount.name}
                description="Les élèves qui ont déjà reçu cette remise gardent ce qui leur a été accordé."
            />
            <DiscountForm
                action={updateDiscount.bind(null, discount.id)}
                submitLabel="Enregistrer"
                initial={{
                    name: discount.name,
                    kind: discount.kind,
                    value: discountValueInput(discount.kind, discount.value),
                    status: discount.active ? "active" : "inactive",
                    validFrom: toDateInput(discount.validFrom),
                    validTo: toDateInput(discount.validTo),
                }}
            />
        </>
    );
}
