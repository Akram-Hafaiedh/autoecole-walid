import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Quick check before any /admin page runs: is there a session cookie at all? It does not
// prove the session is valid, and it makes no database call. Every admin page, layout and
// server action still calls requireAdmin() from lib/auth.ts, which does the real check.
export function proxy(request: NextRequest) {
    if (!getSessionCookie(request)) {
        return NextResponse.redirect(new URL("/connexion", request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
