import { NextRequest, NextResponse } from "next/server";
import { getAdminDB, isAdminConfigured } from "@/lib/firebase-admin";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { LEGACY_COLLECTIONS, reassignOrphans } from "@/lib/legacy-migration";

/**
 * POST /api/users/me — bootstrap the first super admin in Firebase mode.
 *
 * Called right after the client signs in. When the `users` collection is empty
 * (fresh Firestore) and the signed-in user is the default admin account, this
 * creates their `users` doc with role "superadmin" and reassigns the legacy
 * records that have no `userId` yet (pre-multi-account data) so they land on
 * the admin's account.
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
        // Matches missing AND null userId fields in code (Firestore `== null`
        // would miss legacy docs that predate the field entirely).
        let reassigned = 0;
        for (const collection of LEGACY_COLLECTIONS) {
            try {
                reassigned += await reassignOrphans(db, collection, uid);
            } catch {
                /* missing index / no such collection — best effort */
            }
        }

        return NextResponse.json({ success: true, reassigned });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
