import { NextRequest, NextResponse } from "next/server";
import { getAdminDB, isAdminConfigured } from "@/lib/firebase-admin";

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
    try {
        const body = await req.json();
        const { uid, email } = body as { uid?: string; email?: string };
        if (!uid || !email) {
            return NextResponse.json({ error: "uid and email are required" }, { status: 400 });
        }
        const normalizedEmail = String(email).trim().toLowerCase();

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
        let reassigned = 0;
        for (const collection of ["citizens", "sms_logs", "groups"]) {
            try {
                const orphaned = await db
                    .collection(collection)
                    .where("userId", "==", null)
                    .limit(500)
                    .get();
                if (!orphaned.empty) {
                    const batch = db.batch();
                    orphaned.docs.forEach((d) => batch.update(d.ref, { userId: uid }));
                    await batch.commit();
                    reassigned += orphaned.size;
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
