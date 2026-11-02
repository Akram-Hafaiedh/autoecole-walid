// Better Auth, server side. This is the one place where login is configured.
// Server code reads the session through requireAdmin() in lib/auth.ts.

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
    // BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment.
    database: prismaAdapter(prisma, { provider: "postgresql" }),

    emailAndPassword: {
        enabled: true,
        minPasswordLength: 10,
        // Registering does not log anyone in: a new account has no access until the
        // owner activates it (role "admin", see requireAdmin() in lib/auth.ts).
        autoSignIn: false,
    },

    user: {
        additionalFields: {
            // "user" can do nothing yet. "admin" can use the dashboard. input: false means
            // nobody can choose their own role when registering.
            role: { type: "string", required: false, defaultValue: "user", input: false },
        },
    },

    session: { expiresIn: 60 * 60 * 24 * 7 }, // 7 days

    // Kept in the database, because serverless instances do not share memory.
    // Only on the live site: during development, logging in and out to test would hit it.
    rateLimit: {
        enabled: process.env.NODE_ENV === "production",
        storage: "database",
        window: 60,
        max: 60,
        customRules: {
            // 10 sign-in requests per 15 minutes, per IP address. Better Auth counts every
            // request, successful or not, so this is a cap on guessing, not a failure count.
            "/sign-in/email": { window: 15 * 60, max: 10 },
            // 5 registrations per hour, per IP address.
            "/sign-up/email": { window: 60 * 60, max: 5 },
        },
    },

    // Must stay last: lets server actions set the session cookie.
    plugins: [nextCookies()],
});
