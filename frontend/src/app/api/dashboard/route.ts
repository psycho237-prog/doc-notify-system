import { NextRequest, NextResponse } from "next/server";
import { getAdminDB } from "@/lib/firebase-admin";

/** GET /api/dashboard?institutionId=xxx  — aggregate statistics */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const institutionId = searchParams.get("institutionId");
        if (!institutionId) {
            return NextResponse.json({ error: "institutionId is required" }, { status: 400 });
        }

        const db = getAdminDB();
        const userId = searchParams.get("userId");
        const byUser = (q: FirebaseFirestore.Query) =>
            userId ? (q.where("userId", "==", userId) as FirebaseFirestore.Query) : q;
        const base = byUser(
            db.collection("citizens").where("institutionId", "==", institutionId)
        );
        const logsBase = db.collection("sms_logs").where("institutionId", "==", institutionId) as FirebaseFirestore.Query;

        const [total, processing, ready, smsTodaySnap, smsTotalSnap, smsFailedSnap] = await Promise.all([
            base.count().get(),
            byUser(base.where("status", "==", "processing")).count().get(),
            byUser(base.where("status", "==", "ready")).count().get(),
            (() => {
                const midnight = new Date();
                midnight.setHours(0, 0, 0, 0);
                return byUser(
                    logsBase.where("status", "==", "sent").where("sentAt", ">=", midnight)
                )
                    .count()
                    .get();
            })(),
            byUser(logsBase.where("status", "==", "sent")).count().get(),
            byUser(logsBase.where("status", "==", "failed")).count().get(),
        ]);

        // 5 most recent dossiers
        const recentSnap = await base.orderBy("createdAt", "desc").limit(5).get();
        const recent = recentSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? null,
        }));

        return NextResponse.json({
            totalRegistered: total.data().count,
            processing: processing.data().count,
            ready: ready.data().count,
            smsSentToday: smsTodaySnap.data().count,
            smsTotal: smsTotalSnap.data().count,
            smsFailed: smsFailedSnap.data().count,
            recentDossiers: recent,
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
