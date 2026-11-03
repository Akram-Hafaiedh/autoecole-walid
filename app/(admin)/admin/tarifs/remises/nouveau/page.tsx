import type { Metadata } from "next";
import { createDiscount } from "@/actions/tarifs";
import { PageHeader } from "@/components/admin/PageHeader";
import { DiscountForm } from "@/components/tarifs/DiscountForm";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Nouvelle remise" };

export default async function NewDiscountPage() {
    await requireAdmin();

    return (
        <>
            <PageHeader back={{ href: "/admin/tarifs", label: "Tarifs et remises" }} title="Nouvelle remise" />
            <DiscountForm
                action={createDiscount}
                submitLabel="Créer la remise"
                initial={{ name: "", kind: "percent", value: "", status: "active", validFrom: "", validTo: "" }}
            />
        </>
    );
}
