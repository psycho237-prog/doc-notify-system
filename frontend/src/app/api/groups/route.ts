import { NextRequest, NextResponse } from "next/server";
import { getAdminDB } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/** GET /api/groups?institutionId=xxx&userId=xxx — list notification groups. */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const institutionId = searchParams.get("institutionId");
        const userId = searchParams.get("userId");
        if (!institutionId) {
            return NextResponse.json({ error: "institutionId is required" }, { status: 400 });
        }

        const db = getAdminDB();
        let query = db
            .collection("groups")
            .where("institutionId", "==", institutionId) as FirebaseFirestore.Query;
        if (userId) query = query.where("userId", "==", userId);

        const snapshot = await query.orderBy("createdAt", "desc").limit(200).get();
        const groups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ groups });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/** POST /api/groups — create a group (snapshot of members). */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, members, institutionId, userId } = body as {
            name?: string;
            members?: unknown[];
            institutionId?: string;
            userId?: string;
        };
        if (!name || !institutionId || !Array.isArray(members)) {
            return NextResponse.json({ error: "name, members and institutionId are required" }, { status: 400 });
        }

        const db = getAdminDB();
        const docRef = await db.collection("groups").add({
            name,
            members,
            institutionId,
            userId: userId ?? null,
            createdAt: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ id: docRef.id }, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
