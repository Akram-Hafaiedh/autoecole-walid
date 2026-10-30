import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, isValidSessionToken, SESSION_TTL_S } from "./otp";

const COOKIE = "admin_session";

export async function isAdmin(): Promise<boolean> {
    const store = await cookies();
    return isValidSessionToken(store.get(COOKIE)?.value);
}

/**
 * Call this at the top of every admin page, layout and server action.
 * Layouts are not re-run on every client-side navigation, so the layout alone
 * is not enough: each page and each action must check for itself.
 */
export async function requireAdmin(): Promise<void> {
    if (!(await isAdmin())) redirect("/connexion");
}

export async function startSession(): Promise<void> {
    const store = await cookies();
    store.set(COOKIE, createSessionToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_S,
    });
}

export async function endSession(): Promise<void> {
    const store = await cookies();
    store.delete(COOKIE);
}
