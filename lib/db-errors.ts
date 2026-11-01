// Prisma reports "this value already exists" with code P2002. Checked by code rather than by
// importing the error class, so it also works through the pg driver adapter.

export function isUniqueViolation(error: unknown): boolean {
    return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";
}

/** A row refers to something that does not exist (for example a deleted student). Code P2003. */
export function isForeignKeyViolation(error: unknown): boolean {
    return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2003";
}
