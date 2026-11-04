"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { isUuid } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import {
    DUPLICATE_MINUTES,
    MAX_PER_HOUR,
    PROSPECT_STATUSES,
    parseProspectForm,
    type ProspectFormState,
    type ProspectStatusValue,
} from "@/lib/prospects";
import { offers } from "@/lib/site";

/** The contact form of the public site. Open to everyone, so it is guarded against floods. */
export async function sendRequest(_previous: ProspectFormState, formData: FormData): Promise<ProspectFormState> {
    const parsed = parseProspectForm(formData, offers.map((offer) => offer.id));
    if (parsed.ok === "robot") return { sent: true };
    if (!parsed.ok) return { errors: parsed.errors, values: parsed.values, message: "Corrigez les champs en rouge." };

    const now = Date.now();
    const [lastHour, duplicate] = await Promise.all([
        prisma.prospect.count({ where: { createdAt: { gte: new Date(now - 60 * 60_000) } } }),
        prisma.prospect.findFirst({
            where: { phone: parsed.data.phone, createdAt: { gte: new Date(now - DUPLICATE_MINUTES * 60_000) } },
            select: { id: true },
        }),
    ]);

    if (lastHour >= MAX_PER_HOUR) {
        return { message: "Trop de demandes en ce moment. Appelez-nous, ou réessayez plus tard." };
    }
    // The same person sending twice in a row: say thanks, store it once.
    if (!duplicate) await prisma.prospect.create({ data: parsed.data });

    revalidatePath("/admin/demandes");
    revalidatePath("/admin");
    return { sent: true };
}

/** Puts a request away: hidden from the list, kept in the database, and it can be restored. */
export async function archiveProspect(id: string): Promise<void> {
    await requireAdmin();
    if (!isUuid(id)) return;
    await prisma.prospect.updateMany({ where: { id, archivedAt: null }, data: { archivedAt: new Date() } });
    refresh();
}

export async function restoreProspect(id: string): Promise<void> {
    await requireAdmin();
    if (!isUuid(id)) return;
    await prisma.prospect.updateMany({ where: { id }, data: { archivedAt: null } });
    refresh();
}

/** Deletes for good. Only an archived request can be deleted, so a request is never lost by one wrong click. */
export async function deleteProspect(id: string): Promise<void> {
    await requireAdmin();
    if (!isUuid(id)) return;
    await prisma.prospect.deleteMany({ where: { id, archivedAt: { not: null } } });
    refresh();
}

const refresh = () => {
    revalidatePath("/admin/demandes");
    revalidatePath("/admin");
};

export async function setProspectStatus(id: string, status: ProspectStatusValue): Promise<void> {
    await requireAdmin();
    if (!isUuid(id) || !PROSPECT_STATUSES.includes(status)) return;

    await prisma.prospect.updateMany({ where: { id }, data: { status } });
    refresh();
}
