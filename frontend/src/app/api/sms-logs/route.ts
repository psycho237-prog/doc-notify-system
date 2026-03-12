import { NextRequest, NextResponse } from "next/server";
import { getAdminDB } from "@/lib/firebase-admin";

/** GET /api/sms-logs?institutionId=xxx&status=sent|failed&date=yyyy-mm-dd&search=xxx */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const institutionId = searchParams.get("institutionId");
        if (!institutionId) {
            return NextResponse.json({ error: "institutionId is required" }, { status: 400 });
        }

        const db = getAdminDB();
        let query = db.collection("sms_logs").where("institutionId", "==", institutionId) as FirebaseFirestore.Query;

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
