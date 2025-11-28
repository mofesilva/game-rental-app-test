export function resolveDocumentId(document?: unknown): string | undefined {
    if (!document || typeof document !== "object") {
        return undefined;
    }

    const payload = document as { _id?: unknown; insertedId?: unknown };
    if (typeof payload._id === "string") {
        return payload._id;
    }
    if (typeof payload.insertedId === "string") {
        return payload.insertedId;
    }
    return undefined;
}
