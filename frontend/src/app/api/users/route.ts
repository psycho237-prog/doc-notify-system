import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp, getAdminDB, isAdminConfigured } from "@/lib/firebase-admin";

/** GET /api/users — list all user accounts (role + profile). */
export async function GET() {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    try {
        const db = getAdminDB();
        const snap = await db.collection("users").orderBy("createdAt", "asc").limit(200).get();
        const users = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return NextResponse.json({ users });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/** POST /api/users — create a Firebase Auth user + role document. */
export async function POST(req: NextRequest) {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    try {
        const body = await req.json();
        const { name, email, password, role } = body as {
            name?: string;
            email?: string;
            password?: string;
            role?: string;
        };
        if (!name || !email || !password || password.length < 6) {
            return NextResponse.json({ error: "invalid" }, { status: 400 });
        }

        const app = getAdminApp();
        const userRecord = await getAuth(app).createUser({
            email,
            password,
            displayName: name,
        });

        const db = getAdminDB();
        await db.collection("users").doc(userRecord.uid).set({
            name,
            email,
            role: role === "superadmin" ? "superadmin" : "user",
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json({ id: userRecord.uid }, { status: 201 });
    } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === "auth/email-already-exists") {
            return NextResponse.json({ error: "exists" }, { status: 409 });
        }
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
