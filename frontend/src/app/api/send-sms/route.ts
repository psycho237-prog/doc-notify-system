import { NextRequest, NextResponse } from "next/server";
import { getAdminDB } from "@/lib/firebase-admin";
import { detectCamNetwork, formatCamPhone, sanitizeSmsMessage } from "@/lib/phone-utils";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/send-sms
 * Body: {
 *   citizenIds: string[],   // target citizen doc IDs
 *   messageEN: string,      // English template with {name} variable
 *   messageFR: string,      // French template with {name} variable
 *   institutionId: string
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { citizenIds, messageEN, messageFR, institutionId } = body as {
            citizenIds: string[];
            messageEN: string;
            messageFR: string;
            institutionId: string;
        };

        if (!citizenIds?.length || !messageEN || !messageFR || !institutionId) {
            return NextResponse.json(
                { error: "Missing required fields: citizenIds, messageEN, messageFR, institutionId" },
                { status: 400 }
            );
        }

        const apiKey = process.env.MBOASMS_API_KEY || "mboa_e4838de095f741dbace47138fa4765bb";
        const senderId = process.env.MBOASMS_SENDER_ID || "DocNotify";

        if (!apiKey) {
            return NextResponse.json(
                { error: "MboaSMS API Key is not configured." },
                { status: 500 }
            );
        }

        const db = getAdminDB();

        const results: { citizenId: string; status: string; error?: string }[] = [];

        // Process sequentially to avoid rate-limit hammering
        for (const citizenId of citizenIds) {
            try {
                const docSnap = await db.collection("citizens").doc(citizenId).get();
                if (!docSnap.exists) {
                    results.push({ citizenId, status: "skipped", error: "Not found" });
                    continue;
                }

                const citizen = docSnap.data()!;

                // Enforce tenant isolation
                if (citizen.institutionId !== institutionId) {
                    results.push({ citizenId, status: "skipped", error: "Institution mismatch" });
                    continue;
                }

                const template = citizen.language === "FR" ? messageFR : messageEN;
                const personalised = sanitizeSmsMessage(template.replace(/{name}/gi, citizen.fullName ?? ""));
                const phone = formatCamPhone(citizen.phoneNumber ?? "");
                const network = detectCamNetwork(phone);

                // Send SMS via MboaSMS developer API
                const response = await fetch("https://api.mboasms.com/api/v1/developer/sms/send", {
                    method: "POST",
                    headers: {
                        "X-API-Key": apiKey,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        phoneNumbers: [phone],
                        message: personalised,
                        senderId: senderId,
                    }),
                });

                const responseData = await response.json();
                if (!response.ok || !responseData.success) {
                    throw new Error(responseData.message || responseData.error?.details || "Failed to send SMS via MboaSMS");
                }

                const sid = `mboa_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

                await db.collection("sms_logs").add({
                    citizenId,
                    citizenName: citizen.fullName,
                    phoneNumber: phone,
                    message: personalised,
                    network,
                    status: "sent",
                    sid: sid,
                    institutionId,
                    sentAt: FieldValue.serverTimestamp(),
                });

                results.push({ citizenId, status: "sent" });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`SMS failed for ${citizenId}:`, message);

                await db.collection("sms_logs").add({
                    citizenId,
                    status: "failed",
                    error: message,
                    institutionId,
                    sentAt: FieldValue.serverTimestamp(),
                });

                results.push({ citizenId, status: "failed", error: message });
            }
        }

        const sent = results.filter((r) => r.status === "sent").length;
        const failed = results.filter((r) => r.status === "failed").length;

        return NextResponse.json({ success: true, sent, failed, results });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
