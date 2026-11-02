// Creates the admin account, or, if the e-mail already exists (for example someone who
// registered on the site), makes it an admin and sets the password you type.
// Run: npm run auth:create-admin
// It writes to the database in DATABASE_URL (the one in your .env), so to create the
// production account, put the production DATABASE_URL in .env first.

import "dotenv/config";
import { createInterface } from "node:readline";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const MIN_PASSWORD_LENGTH = 10;

function ask(question: string): Promise<string> {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) =>
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        }),
    );
}

/** Like ask(), but nothing is shown while typing. */
function askHidden(question: string): Promise<string> {
    return new Promise((resolve) => {
        process.stdout.write(question);
        const stdin = process.stdin;
        let value = "";
        stdin.setRawMode?.(true);
        stdin.resume();
        stdin.setEncoding("utf8");
        const onData = (chunk: string) => {
            for (const char of chunk) {
                if (char === "\u0003") process.exit(1); // Ctrl+C
                if (char === "\r" || char === "\n") {
                    stdin.setRawMode?.(false);
                    stdin.pause();
                    stdin.off("data", onData);
                    process.stdout.write("\n");
                    return resolve(value);
                }
                if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
                else value += char;
            }
        };
        stdin.on("data", onData);
    });
}

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set. Put it in .env first.");
    }

    const email = (await ask("E-mail : ")).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.error("Cette adresse e-mail n’est pas valide.");
        process.exit(1);
    }
    const password = await askHidden(`Mot de passe (${MIN_PASSWORD_LENGTH} caractères minimum) : `);
    if (password.length < MIN_PASSWORD_LENGTH) {
        console.error(`Trop court : ${MIN_PASSWORD_LENGTH} caractères minimum.`);
        process.exit(1);
    }
    if ((await askHidden("Encore une fois : ")) !== password) {
        console.error("Les deux mots de passe sont différents.");
        process.exit(1);
    }

    const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
    try {
        // Same password settings as lib/auth-server.ts, so the hash is the one login expects.
        const auth = betterAuth({
            secret: process.env.BETTER_AUTH_SECRET ?? "only-used-to-create-an-account-here",
            database: prismaAdapter(prisma, { provider: "postgresql" }),
            emailAndPassword: { enabled: true },
            user: {
                additionalFields: {
                    role: { type: "string", required: false, defaultValue: "user", input: false },
                },
            },
        });
        const context = await auth.$context;
        const hash = await context.password.hash(password);

        const existing = await context.internalAdapter.findUserByEmail(email);
        if (existing) {
            // Also activates an account that registered on the site.
            await context.internalAdapter.updatePassword(existing.user.id, hash);
            await context.internalAdapter.updateUser(existing.user.id, { role: "admin" });
        } else {
            const user = await context.internalAdapter.createUser(
                {
                    email,
                    name: "Responsable",
                    emailVerified: true,
                    role: "admin",
                },
                { method: "admin" }, // where the account comes from, required by newer versions
            );
            await context.internalAdapter.linkAccount({
                userId: user.id,
                providerId: "credential",
                accountId: user.id,
                password: hash,
            });
        }
        console.log(`\nCompte prêt : ${email}. Vous pouvez vous connecter sur /connexion.`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
