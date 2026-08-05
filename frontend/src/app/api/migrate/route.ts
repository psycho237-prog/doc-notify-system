import { NextRequest, NextResponse } from "next/server";
import { getAdminDB, isAdminConfigured } from "@/lib/firebase-admin";
import { forbidden, requireAuth } from "@/lib/api-auth";
import { LEGACY_COLLECTIONS, reassignOrphans } from "@/lib/legacy-migration";

/**
 * POST /api/migrate — one-off data migration (super admin only).
 *
 * Assigns every legacy record (citizens / sms_logs / groups / deleted_citizens)
 * that has no userId to the calling super admin, so pre-multi-account data
 * shows up under the admin account. Idempotent: already-owned records are
 * never touched, so running it again is harmless.
 */
export async function POST(req: NextRequest) {
    if (!isAdminConfigured()) {
        return NextResponse.json({ error: "Firebase is not configured" }, { status: 503 });
    }
    const session = await requireAuth(req, { admin: true });
    if (!session) return forbidden();

    try {
        const db = getAdminDB();
        const migrated: Record<string, number> = {};
        const errors: string[] = [];

        for (const collection of LEGACY_COLLECTIONS) {
            try {
                migrated[collection] = await reassignOrphans(db, collection, session.auth.uid);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`[migrate] ${collection}:`, err);
                errors.push(`${collection}: ${message}`);
            }
        }

        return NextResponse.json({ success: true, migrated, errors });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
