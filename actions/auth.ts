"use server";

import { redirect } from "next/navigation";
import { endSession, startSession } from "@/lib/auth";
import { maskedAdminEmail, sendLoginCode } from "@/lib/mail";
import {
    CODE_TTL_MS,
    MAX_ATTEMPTS,
    MAX_CODES_PER_HOUR,
    RESEND_COOLDOWN_MS,
    codeMatches,
    generateCode,
    hashCode,
    normalizeCode,
} from "@/lib/otp";

import { prisma } from "@/lib/prisma";

export type FormState = { status: "idle" | "sent" | "error"; message?: string };

const fail = (message: string): FormState => ({ status: "error", message });

export async function requestCode(_previous: FormState): Promise<FormState> {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Keep the table small.
    await prisma.loginCode.deleteMany({
        where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    });

    const recent = await prisma.loginCode.findMany({
        where: { createdAt: { gt: hourAgo } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
    });

    if (recent[0] && now.getTime() - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS) {
        return fail("Un code vient d’être envoyé. Patientez une minute avant d’en demander un autre.");
    }
    if (recent.length >= MAX_CODES_PER_HOUR) {
        return fail("Trop de demandes. Réessayez dans une heure.");
    }

    const code = generateCode();
    const row = await prisma.loginCode.create({
        data: {
            codeHash: hashCode(code),
            expiresAt: new Date(now.getTime() + CODE_TTL_MS),
        },
    });

    try {
        await sendLoginCode(code);
    } catch (error) {
        console.error("Could not send the login code:", error);
        // Burn the code but keep the row so failed sends still count toward the limit.
        await prisma.loginCode.update({ where: { id: row.id }, data: { usedAt: now } });
        return fail("L’envoi de l’e-mail a échoué. Réessayez dans une minute.");
    }

    // Only the newest code works.
    await prisma.loginCode.updateMany({
        where: { usedAt: null, id: { not: row.id } },
        data: { usedAt: now },
    });

    return { status: "sent", message: `Un code a été envoyé à ${maskedAdminEmail()}.` };
}

export async function verifyCode(
    _previous: FormState,
    formData: FormData,
): Promise<FormState> {
    const code = normalizeCode(String(formData.get("code") ?? ""));
    if (!code) return fail("Entrez les 6 chiffres du code.");

    const now = new Date();
    const current = await prisma.loginCode.findFirst({
        where: { usedAt: null, expiresAt: { gt: now } },
        orderBy: { createdAt: "desc" },
    });
    if (!current) return fail("Code expiré ou introuvable. Demandez un nouveau code.");

    // Count the guess first and atomically, so parallel requests cannot exceed the limit.
    const counted = await prisma.loginCode.updateMany({
        where: { id: current.id, usedAt: null, attempts: { lt: MAX_ATTEMPTS } },
        data: { attempts: { increment: 1 } },
    });
    if (counted.count === 0) return fail("Trop d’essais. Demandez un nouveau code.");

    if (!codeMatches(code, current.codeHash)) return fail("Code incorrect.");

    // Single use: only one request can flip usedAt.
    const used = await prisma.loginCode.updateMany({
        where: { id: current.id, usedAt: null },
        data: { usedAt: now },
    });
    if (used.count === 0) return fail("Ce code a déjà été utilisé. Demandez-en un nouveau.");

    await startSession();
    redirect("/admin");
}

export async function logout(): Promise<void> {
    await endSession();
    redirect("/connexion");
}
