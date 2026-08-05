import { NextRequest, NextResponse } from "next/server";
import {
    formatCamPhone,
    isValidCamPhone,
    sanitizeSmsMessage,
} from "@/lib/phone-utils";
import { getAdminDB, isAdminConfigured } from "@/lib/firebase-admin";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import type { AuthSession } from "@/lib/api-auth";

interface IncomingRecipient {
    name?: string;
    phone?: string;
}

interface ResultItem {
    name: string;
    phone: string;
    status: "sent" | "failed";
    message?: string;
    error?: string;
}

/**
 * POST /api/send-sms
 *
 * Body: {
 *   recipients: [{ name, phone }, ...],   // up to 500
 *   message: string,                      // template with {name} variable
 *   simulate?: boolean                    // skip the real MboaSMS call
 * }
 *
 * Each recipient gets the same message personalized with their own name,
 * fully sanitized (no special characters). When a Firebase service account
 * is configured, every result is also logged to Firestore (sms_logs).
 */
export async function POST(req: NextRequest) {
    try {
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        const { recipients, message, simulate, userId } = body as {
            recipients?: IncomingRecipient[];
            message?: string;
            simulate?: boolean;
            userId?: string;
        };

        // On fully configured deployments, only authenticated users may send SMS
        // (the verified uid is used for logging — the client-supplied one is ignored).
        // Local/demo deployments (no Firebase service account) stay open so the
        // zero-config local mode keeps working.
        let session: AuthSession | null = null;
        if (isAdminConfigured()) {
            session = await requireAuth(req);
            if (!session) return unauthorized();
        }

        if (!Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json(
                { error: "recipients is required and must not be empty" },
                { status: 400 }
            );
        }
        if (recipients.length > 500) {
            return NextResponse.json(
                { error: "Too many recipients (max 500 per batch)" },
                { status: 400 }
            );
        }
        if (!message || !message.trim()) {
            return NextResponse.json({ error: "message is required" }, { status: 400 });
        }

        const apiKey = process.env.MBOASMS_API_KEY || "mboa_e4838de095f741dbace47138fa4765bb";
        const senderId = process.env.MBOASMS_SENDER_ID || "DocNotify";
        const doSimulate = simulate === true;

        const results: ResultItem[] = [];
        let sent = 0;
        let failed = 0;

        for (const raw of recipients) {
            const name = String(raw.name ?? "").trim();
            const phone = formatCamPhone(String(raw.phone ?? "").trim());

            if (!name || !isValidCamPhone(phone)) {
                failed++;
                results.push({
                    name,
                    phone,
                    status: "failed",
                    error: "Nom manquant ou numéro invalide",
                });
                continue;
            }

            // Personalized + sanitized: no accents, no emoji, no special chars.
            const personalised = sanitizeSmsMessage(
                message.replace(/{name}/gi, name)
            );

            let status: "sent" | "failed" = "sent";
            let error: string | undefined;

            if (!doSimulate) {
                try {
                    const response = await fetch(
                        "https://api.mboasms.com/api/v1/developer/sms/send",
                        {
                            method: "POST",
                            headers: {
                                "X-API-Key": apiKey,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                phoneNumbers: [phone],
                                message: personalised,
                                senderId,
                            }),
                        }
                    );
                    const data = (await response.json().catch(() => ({}))) as {
                        success?: boolean;
                        message?: string;
                        error?: { details?: string };
                    };
                    if (!response.ok || !data.success) {
                        throw new Error(
                            data.message ||
                            data.error?.details ||
                            "Échec d'envoi via MboaSMS"
                        );
                    }
                } catch (err) {
                    status = "failed";
                    error = err instanceof Error ? err.message : String(err);
                }
            }

            if (status === "sent") sent++;
            else failed++;

            results.push({ name, phone, status, message: personalised, error });
        }

        // Optional: persist to Firestore when a service account is configured.
        if (isAdminConfigured()) {
            try {
                const { FieldValue } = await import("firebase-admin/firestore");
                const db = getAdminDB();
                const batch = db.batch();
                const col = db.collection("sms_logs");
                const loggedUserId = session ? session.auth.uid : (userId ?? null);
                for (const r of results) {
                    batch.set(col.doc(), {
                        citizenName: r.name,
                        phoneNumber: r.phone,
                        message: r.message ?? "",
                        status: r.status,
                        error: r.error ?? null,
                        institutionId: "nnlomne",
                        userId: loggedUserId,
                        sentAt: FieldValue.serverTimestamp(),
                    });
                }
                await batch.commit();
            } catch (err) {
                console.error("[send-sms] Failed to log to Firestore:", err);
            }
        }

        return NextResponse.json({ success: true, sent, failed, results });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[send-sms] Unexpected error:", err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
