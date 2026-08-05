import { NextRequest, NextResponse } from "next/server";
import { getAdminDB } from "@/lib/firebase-admin";

/** PATCH /api/groups/[id] — update name and/or members. */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const db = getAdminDB();
        const patch: Record<string, unknown> = {};
        if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
        if (Array.isArray(body.members)) patch.members = body.members;
        if (Object.keys(patch).length === 0) {
            return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
        }
        await db.collection("groups").doc(params.id).update(patch);
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/** DELETE /api/groups/[id] */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const db = getAdminDB();
        await db.collection("groups").doc(params.id).delete();
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
