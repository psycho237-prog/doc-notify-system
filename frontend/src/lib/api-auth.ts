import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp, getAdminDB, isAdminConfigured } from "./firebase-admin";

export interface AuthUser {
    uid: string;
    email?: string;
}

export interface AuthSession {
    auth: AuthUser;
    isAdmin: boolean;
}

export function unauthorized(message = "Unauthorized"): NextResponse {
    return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden"): NextResponse {
    return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Verifies the Firebase ID token from the `Authorization: Bearer` header.
 * Returns null when the header is missing, the token is invalid/expired, or
 * Firebase is not configured server-side (in which case no token can be
 * verified at all).
 */
export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
    if (!isAdminConfigured()) return null;
    const header = req.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) return null;
    try {
        const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
        return { uid: decoded.uid, email: decoded.email };
    } catch {
        return null;
    }
}

/** Resolves the account role from the `users` collection (superadmin | user | null). */
export async function getRole(uid: string): Promise<"superadmin" | "user" | null> {
    try {
        const snap = await getAdminDB().collection("users").doc(uid).get();
        const role = snap.data()?.role;
        return role === "superadmin" || role === "user" ? role : null;
    } catch {
        return null;
    }
}

/**
 * Authenticates the request and optionally enforces the superadmin role.
 * Returns null when unauthenticated — or when `admin: true` and the caller is
 * not a super admin. Callers respond with unauthorized()/forbidden().
 */
export async function requireAuth(
    req: NextRequest,
    opts?: { admin?: boolean }
): Promise<AuthSession | null> {
    const auth = await verifyAuth(req);
    if (!auth) return null;
    const isAdmin = (await getRole(auth.uid)) === "superadmin";
    if (opts?.admin && !isAdmin) return null;
    return { auth, isAdmin };
}
