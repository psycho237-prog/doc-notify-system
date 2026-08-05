import { NextRequest, NextResponse } from "next/server";
import { getAdminDB, isAdminConfigured } from "@/lib/firebase-admin";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";

/** GET /api/citizens/[id] */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    const session = await requireAuth(req);
    if (!session) return unauthorized();
    try {
        const db = getAdminDB();
        const doc = await db.collection("citizens").doc(params.id).get();
        if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (!session.isAdmin && doc.data()?.userId !== session.auth.uid) return forbidden();
        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/** PATCH /api/citizens/[id] — update selected fields (owner only) */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    const session = await requireAuth(req);
    if (!session) return unauthorized();
    try {
        const db = getAdminDB();
        const docRef = db.collection("citizens").doc(params.id);
        const snap = await docRef.get();
        if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (!session.isAdmin && snap.data()?.userId !== session.auth.uid) return forbidden();

        const body = await req.json();
        const { userId, ...patch } = body;
        // Ownership can never be reassigned through this endpoint — only the
        // caller's own uid (or any uid for super admins) is acceptable.
        if (userId && userId !== session.auth.uid && !session.isAdmin) return forbidden();
        await docRef.update(patch);
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/** DELETE /api/citizens/[id] — soft-delete with audit log (owner only) */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    const session = await requireAuth(req);
    if (!session) return unauthorized();
    try {
        const db = getAdminDB();
        const docRef = db.collection("citizens").doc(params.id);
        const snap = await docRef.get();
        if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (!session.isAdmin && snap.data()?.userId !== session.auth.uid) return forbidden();

        // Copy to audit trail before deleting (userId comes from the doc itself).
        await db.collection("deleted_citizens").doc(params.id).set({
            ...snap.data(),
            userId: snap.data()?.userId ?? session.auth.uid,
            deletedAt: new Date().toISOString(),
        });

        await docRef.delete();
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
