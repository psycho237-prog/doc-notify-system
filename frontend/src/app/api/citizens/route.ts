import { NextRequest, NextResponse } from "next/server";
import { getAdminDB } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/** GET /api/citizens?institutionId=xxx&status=ready&service=Xxx&search=xxx */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const institutionId = searchParams.get("institutionId");
        if (!institutionId) {
            return NextResponse.json({ error: "institutionId is required" }, { status: 400 });
        }

        const db = getAdminDB();
        let query = db.collection("citizens").where("institutionId", "==", institutionId) as FirebaseFirestore.Query;

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

/** POST /api/citizens — create a new citizen record */
export async function POST(req: NextRequest) {
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
            createdAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ id: docRef.id }, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
