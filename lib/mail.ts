// Sends the login code to the owner through Resend's HTTP API (no extra package).
// In development, with no RESEND_API_KEY, the code is printed in the server console.

function adminEmail(): string {
    const email = process.env.ADMIN_EMAIL;
    if (!email) throw new Error("ADMIN_EMAIL is not set.");
    return email;
}

/** "walid@gmail.com" becomes "w***@gmail.com". Safe to show on the login page. */
export function maskedAdminEmail(): string {
    const [name = "", domain = ""] = adminEmail().split("@");
    return `${name.slice(0, 1)}***@${domain}`;
}

export async function sendLoginCode(code: string): Promise<void> {
    const to = adminEmail();
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("RESEND_API_KEY is not set.");
        }
        console.log(`[dev] Login code for ${to}: ${code}`);
        return;
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: process.env.MAIL_FROM ?? "Auto-École Walid <onboarding@resend.dev>",
            to: [to],
            subject: `Code de connexion : ${code}`,
            text: [
                `Votre code de connexion : ${code}`,
                "",
                "Il est valable 10 minutes et ne peut servir qu'une fois.",
                "Si vous n'avez pas demandé ce code, ignorez ce message.",
            ].join("\n"),
        }),
    });

    if (!response.ok) {
        throw new Error(`Resend answered ${response.status}: ${await response.text()}`);
    }
}
