import { NextRequest, NextResponse } from "next/server";
import { getAdminDB, isAdminConfigured } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";

/** GET /api/groups?institutionId=xxx&userId=xxx — list notification groups. */
export async function GET(req: NextRequest) {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    const session = await requireAuth(req);
    if (!session) return unauthorized();
    try {
        const { searchParams } = new URL(req.url);
        const institutionId = searchParams.get("institutionId");
        const userId = searchParams.get("userId");
        if (!institutionId) {
            return NextResponse.json({ error: "institutionId is required" }, { status: 400 });
        }
        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }
        if (userId !== session.auth.uid && !session.isAdmin) return forbidden();

        const db = getAdminDB();
        const query = db
            .collection("groups")
            .where("institutionId", "==", institutionId)
            .where("userId", "==", userId) as FirebaseFirestore.Query;

        const snapshot = await query.orderBy("createdAt", "desc").limit(200).get();
        const groups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ groups });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/** POST /api/groups — create a group (owned by the caller). */
export async function POST(req: NextRequest) {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    const session = await requireAuth(req);
    if (!session) return unauthorized();
    try {
        const body = await req.json();
        const { name, members, institutionId } = body as {
            name?: string;
            members?: unknown[];
            institutionId?: string;
        };
        if (!name || !institutionId || !Array.isArray(members)) {
            return NextResponse.json({ error: "name, members and institutionId are required" }, { status: 400 });
        }

        const db = getAdminDB();
        const docRef = await db.collection("groups").add({
            name,
            members,
            institutionId,
            userId: session.auth.uid,
            createdAt: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ id: docRef.id }, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
