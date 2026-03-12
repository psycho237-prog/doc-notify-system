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
        const base = db.collection("citizens").where("institutionId", "==", institutionId);

        const [total, processing, ready, smsTodaySnap] = await Promise.all([
            base.count().get(),
            base.where("status", "==", "processing").count().get(),
            base.where("status", "==", "ready").count().get(),
            (() => {
                const midnight = new Date();
                midnight.setHours(0, 0, 0, 0);
                return db
                    .collection("sms_logs")
                    .where("institutionId", "==", institutionId)
                    .where("status", "==", "sent")
                    .where("sentAt", ">=", midnight)
                    .count()
                    .get();
            })(),
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
            recentDossiers: recent,
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
