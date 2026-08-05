import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp, getAdminDB, isAdminConfigured } from "@/lib/firebase-admin";
import { forbidden, requireAuth } from "@/lib/api-auth";

/** PATCH /api/users/[id] — update name / role / password (super admin only). */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    const session = await requireAuth(req, { admin: true });
    if (!session) return forbidden();
    try {
        const id = params.id;
        const body = await req.json();
        const { name, email, role, password, disabled } = body as {
            name?: string;
            email?: string;
            role?: string;
            password?: string;
            disabled?: boolean;
        };

        const app = getAdminApp();
        const auth = getAuth(app);
        const db = getAdminDB();

        // Firebase Auth: display name, optional email change (uniqueness-checked), optional password reset.
        const authPatch: { displayName?: string; email?: string; password?: string } = {};
        if (typeof name === "string" && name.trim()) authPatch.displayName = name.trim();
        if (typeof email === "string" && email.trim()) {
            const newEmail = email.trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                return NextResponse.json({ error: "invalid_email" }, { status: 400 });
            }
            try {
                const existing = await auth.getUserByEmail(newEmail);
                if (existing.uid !== id) {
                    return NextResponse.json({ error: "exists" }, { status: 409 });
                }
            } catch (err: unknown) {
                // auth/user-not-found means the address is available; anything else bubbles up.
                if ((err as { code?: string })?.code !== "auth/user-not-found") throw err;
            }
            authPatch.email = newEmail;
        }
        if (typeof password === "string" && password.length > 0) {
            if (password.length < 6) {
                return NextResponse.json({ error: "invalid" }, { status: 400 });
            }
            authPatch.password = password;
        }
        if (Object.keys(authPatch).length > 0) {
            await auth.updateUser(id, authPatch);
        }

        // Firestore role document (create or merge — never silently drop changes).
        const docPatch: Record<string, unknown> = {};
        if (typeof name === "string" && name.trim()) docPatch.name = name.trim();
        if (typeof email === "string" && email.trim()) docPatch.email = email.trim().toLowerCase();
        if (role === "superadmin" || role === "user") docPatch.role = role;
        if (typeof disabled === "boolean") docPatch.disabled = disabled;
        if (Object.keys(docPatch).length > 0) {
            await db.collection("users").doc(id).set(docPatch, { merge: true });
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/** DELETE /api/users/[id] — delete the auth user, role doc and account data (super admin only). */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    const session = await requireAuth(req, { admin: true });
    if (!session) return forbidden();
    try {
        const id = params.id;
        const app = getAdminApp();
        const db = getAdminDB();

        await getAuth(app)
            .deleteUser(id)
            .catch(() => {
                /* auth user may not exist (local-style id) */
            });
        await db
            .collection("users")
            .doc(id)
            .delete()
            .catch(() => {
                /* role doc may not exist */
            });

        // Best-effort removal of the account's data.
        try {
            const citizens = await db.collection("citizens").where("userId", "==", id).get();
            if (citizens.size > 0) {
                const batch = db.batch();
                citizens.docs.forEach((d) => batch.delete(d.ref));
                await batch.commit();
            }
        } catch {
            /* missing index — data kept, account removed */
        }
        try {
            const logs = await db.collection("sms_logs").where("userId", "==", id).get();
            if (logs.size > 0) {
                const batch = db.batch();
                logs.docs.forEach((d) => batch.delete(d.ref));
                await batch.commit();
            }
        } catch {
            /* missing index — data kept, account removed */
        }
        try {
            const groups = await db.collection("groups").where("userId", "==", id).get();
            if (groups.size > 0) {
                const batch = db.batch();
                groups.docs.forEach((d) => batch.delete(d.ref));
                await batch.commit();
            }
        } catch {
            /* best effort */
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
