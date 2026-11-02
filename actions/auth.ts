"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth-server";

// Signing in happens in the browser (components/auth/LoginForm.tsx), so that Better
// Auth's rate limit applies to it. Signing out can be done here.
export async function logout(): Promise<void> {
    await auth.api.signOut({ headers: await headers() });
    redirect("/connexion");
}
