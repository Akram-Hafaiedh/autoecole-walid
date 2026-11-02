import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth-server";

/** The signed-in user, or null. Read once per request, even if called many times. */
export const getSession = cache(async () =>
    auth.api.getSession({ headers: await headers() }),
);

/** True only for an account the owner has activated (role "admin"). */
export async function isAdmin(): Promise<boolean> {
    return (await getSession())?.user.role === "admin";
}

/**
 * Call this at the top of every admin page, layout and server action.
 * Layouts are not re-run on every client-side navigation, so the layout alone
 * is not enough: each page and each action must check for itself.
 */
export async function requireAdmin(): Promise<void> {
    if (!(await isAdmin())) redirect("/connexion");
}
