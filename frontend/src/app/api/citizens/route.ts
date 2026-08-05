import { NextRequest, NextResponse } from "next/server";
import { getAdminDB, isAdminConfigured } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";

/** GET /api/citizens?institutionId=xxx&userId=xxx&status=ready&service=Xxx&search=xxx */
export async function GET(req: NextRequest) {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    const session = await requireAuth(req);
    if (!session) return unauthorized();
    try {
        const { searchParams } = new URL(req.url);
        const institutionId = searchParams.get("institutionId");
        if (!institutionId) {
            return NextResponse.json({ error: "institutionId is required" }, { status: 400 });
        }

        // Users may only read their own records; super admins may read any.
        const userId = searchParams.get("userId");
        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }
        if (userId !== session.auth.uid && !session.isAdmin) return forbidden();

        const db = getAdminDB();
        let query = db.collection("citizens").where("institutionId", "==", institutionId) as FirebaseFirestore.Query;
        query = query.where("userId", "==", userId);

        const status = searchParams.get("status");
        if (status && status !== "all") query = query.where("status", "==", status);

        const service = searchParams.get("service");
        if (service && service !== "all") query = query.where("service", "==", service);

        const snapshot = await query.orderBy("createdAt", "desc").limit(100).get();

        const citizens = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
        }));

        // Client-side text search
        const search = searchParams.get("search")?.toLowerCase();
        const filtered = search
            ? citizens.filter(
                (c: Record<string, unknown>) =>
                    String(c.fullName ?? "").toLowerCase().includes(search) ||
                    String(c.phoneNumber ?? "").includes(search)
            )
            : citizens;

        return NextResponse.json({ citizens: filtered });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/** POST /api/citizens — create a new citizen record (owned by the caller). */
export async function POST(req: NextRequest) {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    const session = await requireAuth(req);
    if (!session) return unauthorized();
    try {
        const body = await req.json();
        const { fullName, phoneNumber, language, service, requestType, status, institutionId } = body;

        if (!fullName || !phoneNumber || !institutionId) {
            return NextResponse.json({ error: "fullName, phoneNumber and institutionId are required" }, { status: 400 });
        }

        const db = getAdminDB();
        const docRef = await db.collection("citizens").add({
            fullName,
            phoneNumber,
            language: language ?? "FR",
            service: service ?? "",
            requestType: requestType ?? "",
            status: status ?? "pending",
            institutionId,
            userId: session.auth.uid,
            createdAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ id: docRef.id }, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
