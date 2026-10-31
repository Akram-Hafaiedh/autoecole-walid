import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSessionToken } from "@/lib/otp";

// Quick cookie check before any /admin page runs. No database access here.
// This is a safety net, not the only lock: every admin page, layout and server
// action still calls requireAdmin() from lib/auth.ts.
export function proxy(request: NextRequest) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    if (!isValidSessionToken(token)) {
        return NextResponse.redirect(new URL("/connexion", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
