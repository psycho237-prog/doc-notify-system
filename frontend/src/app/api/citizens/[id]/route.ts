import { NextRequest, NextResponse } from "next/server";
import { getAdminDB } from "@/lib/firebase-admin";

/** GET /api/citizens/[id] */
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const db = getAdminDB();
        const doc = await db.collection("citizens").doc(params.id).get();
        if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/** PATCH /api/citizens/[id] — update selected fields */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const db = getAdminDB();
        await db.collection("citizens").doc(params.id).update(body);
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/** DELETE /api/citizens/[id] — soft-delete with audit log */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const db = getAdminDB();
        const docRef = db.collection("citizens").doc(params.id);
        const snap = await docRef.get();
        if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Copy to audit trail before deleting
        await db.collection("deleted_citizens").doc(params.id).set({
            ...snap.data(),
            deletedAt: new Date().toISOString(),
        });

        await docRef.delete();
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
