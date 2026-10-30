// Login codes and session tokens. Pure functions on node:crypto, no framework imports,
// so they can be tested on their own.
//
// Security model:
// - A code is 6 digits, valid 10 minutes, usable once, and dies after 5 guesses.
// - Only an HMAC of the code is stored, keyed with SESSION_SECRET, so a leaked
//   database cannot be used to work out codes offline.
// - A session is a signed expiry date in a cookie. Changing SESSION_SECRET
//   signs everyone out.

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const MAX_CODES_PER_HOUR = 5;
export const SESSION_TTL_S = 7 * 24 * 60 * 60;

function secret(): string {
    const value = process.env.SESSION_SECRET;
    if (!value || value.length < 32) {
        throw new Error("SESSION_SECRET must be set to a random string of 32+ characters.");
    }
    return value;
}

function mac(label: string, value: string | number): string {
    return createHmac("sha256", secret()).update(`${label}:${value}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
}

/** Six digits, uniformly random, leading zeros kept. */
export function generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashCode(code: string): string {
    return mac("code", code);
}

export function codeMatches(code: string, storedHash: string): boolean {
    return safeEqual(hashCode(code), storedHash);
}

/** Accepts "123456" or "123 456". Returns null when it is not six digits. */
export function normalizeCode(input: string): string | null {
    const cleaned = input.replace(/\s/g, "");
    return /^\d{6}$/.test(cleaned) ? cleaned : null;
}

export function createSessionToken(nowMs: number = Date.now()): string {
    const expires = Math.floor(nowMs / 1000) + SESSION_TTL_S;
    return `${expires}.${mac("session", expires)}`;
}

export function isValidSessionToken(
    token: string | undefined,
    nowMs: number = Date.now(),
): boolean {
    if (!token) return false;
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [expires, signature] = parts;
    if (!/^\d+$/.test(expires) || Number(expires) <= nowMs / 1000) return false;
    return safeEqual(mac("session", expires), signature);
}
