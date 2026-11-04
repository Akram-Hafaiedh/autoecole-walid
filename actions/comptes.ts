"use server";

import { revalidatePath } from "next/cache";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const refresh = () => {
    revalidatePath("/admin/comptes");
    revalidatePath("/admin");
};

/** Lets a registered person use the dashboard. */
export async function activateAccount(id: string): Promise<void> {
    await requireAdmin();
    await prisma.user.updateMany({ where: { id, role: "user" }, data: { role: "admin" } });
    refresh();
}

/**
 * Takes the access away again and signs the person out everywhere. You cannot do this to
 * yourself, and the last administrator can never be removed, so the school is never locked out.
 */
export async function deactivateAccount(id: string): Promise<void> {
    await requireAdmin();
    const session = await getSession();
    if (!session || session.user.id === id) return;

    await prisma.$transaction(async (tx) => {
        const others = await tx.user.count({ where: { role: "admin", id: { not: id } } });
        if (others === 0) return;
        const result = await tx.user.updateMany({ where: { id, role: "admin" }, data: { role: "user" } });
        if (result.count > 0) await tx.session.deleteMany({ where: { userId: id } });
    });
    refresh();
}

/** Removes an account that was never activated (a mistake or spam). An active account cannot be deleted. */
export async function deletePendingAccount(id: string): Promise<void> {
    await requireAdmin();
    await prisma.user.deleteMany({ where: { id, role: "user" } });
    refresh();
}
