import { NextRequest, NextResponse } from "next/server";
import { getAdminDB, isAdminConfigured } from "@/lib/firebase-admin";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";

/** PATCH /api/groups/[id] — update name and/or members (owner only). */
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
        const docRef = db.collection("groups").doc(params.id);
        const snap = await docRef.get();
        if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (!session.isAdmin && snap.data()?.userId !== session.auth.uid) return forbidden();

        const body = await req.json();
        const patch: Record<string, unknown> = {};
        if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
        if (Array.isArray(body.members)) patch.members = body.members;
        if (Object.keys(patch).length === 0) {
            return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
        }
        await docRef.update(patch);
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/** DELETE /api/groups/[id] (owner only). */
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
        const docRef = db.collection("groups").doc(params.id);
        const snap = await docRef.get();
        if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (!session.isAdmin && snap.data()?.userId !== session.auth.uid) return forbidden();
        await docRef.delete();
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
