import { NextRequest, NextResponse } from "next/server";
import { getAdminDB, isAdminConfigured } from "@/lib/firebase-admin";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";

/** GET /api/sms-logs?institutionId=xxx&userId=xxx&status=sent|failed&date=yyyy-mm-dd&search=xxx */
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

        // Users may only read their own logs; super admins may read any account.
        const userId = searchParams.get("userId");
        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }
        if (userId !== session.auth.uid && !session.isAdmin) return forbidden();

        const db = getAdminDB();
        let query = db.collection("sms_logs").where("institutionId", "==", institutionId) as FirebaseFirestore.Query;
        query = query.where("userId", "==", userId);

        const status = searchParams.get("status");
        if (status && status !== "all") query = query.where("status", "==", status);

        const snapshot = await query.orderBy("sentAt", "desc").limit(200).get();

        const logs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            sentAt: doc.data().sentAt?.toDate?.()?.toISOString() ?? null,
        }));

        // Optional text search
        const search = searchParams.get("search")?.toLowerCase();
        const filtered = search
            ? logs.filter(
                (l: Record<string, unknown>) =>
                    String(l.citizenName ?? "").toLowerCase().includes(search) ||
                    String(l.phoneNumber ?? "").includes(search)
            )
            : logs;

        return NextResponse.json({ logs: filtered });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
