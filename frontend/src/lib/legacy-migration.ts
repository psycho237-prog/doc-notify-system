/**
 * Shared legacy-data migration helpers (server-side).
 *
 * Legacy docs written before the multi-account update have NO `userId` field,
 * and Firestore `== null` never matches a missing field — so the orphan match
 * must happen in code. Used by the superadmin bootstrap (POST /api/users/me)
 * and the one-off migration (POST /api/migrate).
 */

/** Collections holding per-account records that predate the userId field. */
export const LEGACY_COLLECTIONS = [
    "citizens",
    "sms_logs",
    "groups",
    "deleted_citizens",
] as const;

/**
 * Paginates a collection by document id and sets `userId` on every record
 * that lacks it (missing OR null). Idempotent: already-owned records are
 * never touched, so re-running is harmless.
 */
export async function reassignOrphans(
    db: FirebaseFirestore.Firestore,
    collection: string,
    uid: string
): Promise<number> {
    let migrated = 0;
    let lastDoc: FirebaseFirestore.DocumentSnapshot | undefined;
    for (;;) {
        let q = db
            .collection(collection)
            .where("institutionId", "==", "nnlomne")
            .orderBy("__name__")
            .limit(500);
        if (lastDoc) q = q.startAfter(lastDoc);
        const snap = await q.get();
        if (snap.empty) break;

        const orphaned = snap.docs.filter((d) => {
            const userId = d.data().userId;
            return userId === undefined || userId === null;
        });
        if (orphaned.length > 0) {
            const batch = db.batch();
            orphaned.forEach((d) => batch.update(d.ref, { userId: uid }));
            await batch.commit();
            migrated += orphaned.length;
        }

        lastDoc = snap.docs[snap.docs.length - 1];
        if (snap.docs.length < 500) break;
    }
    return migrated;
}
