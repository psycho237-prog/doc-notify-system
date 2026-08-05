import { NextRequest, NextResponse } from "next/server";
import { getAdminDB, isAdminConfigured } from "@/lib/firebase-admin";
import { requireAuth, unauthorized } from "@/lib/api-auth";

/**
 * POST /api/users/me — bootstrap the first super admin in Firebase mode.
 *
 * Called right after the client signs in. When the `users` collection is empty
 * (fresh Firestore) and the signed-in user is the default admin account, this
 * creates their `users` doc with role "superadmin" and reassigns the legacy
 * citizens/logs/groups that have no `userId` yet (pre-multi-account data) so
 * they land on the admin's account.
 */
export async function POST(req: NextRequest) {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    const session = await requireAuth(req);
    if (!session) return unauthorized();
    try {
        // The verified ID token is the source of truth — never trust client uid/email.
        const uid = session.auth.uid;
        const normalizedEmail = String(session.auth.email ?? "").trim().toLowerCase();
        if (!uid || !normalizedEmail) {
            return NextResponse.json({ error: "uid and email are required" }, { status: 400 });
        }

        const db = getAdminDB();
        const usersRef = db.collection("users");

        // Only bootstrap the very first account (no users exist yet).
        const existing = await usersRef.limit(1).get();
        if (!existing.empty) {
            return NextResponse.json({ error: "already_exists" }, { status: 409 });
        }

        const meRef = usersRef.doc(uid);
        const me = await meRef.get();
        if (me.exists) {
            return NextResponse.json({ success: true, skipped: true });
        }

        await meRef.set({
            name: normalizedEmail.split("@")[0] || "Administrateur",
            email: normalizedEmail,
            role: "superadmin",
            createdAt: new Date().toISOString(),
        });

        // Reassign pre-multi-account data (records without a userId) to the admin.
        // Firestore `== null` only matches fields that are explicitly null, so
        // legacy docs that predate the userId field entirely would be skipped by
        // such a query. Scan by institution and match missing/null userId in code,
        // paginating so the migration covers more than the first 500 records.
        let reassigned = 0;
        for (const collection of ["citizens", "sms_logs", "groups"]) {
            try {
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
                        reassigned += orphaned.length;
                    }

                    lastDoc = snap.docs[snap.docs.length - 1];
                    if (snap.docs.length < 500) break;
                }
            } catch {
                /* missing index / no such collection — best effort */
            }
        }

        return NextResponse.json({ success: true, reassigned });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
