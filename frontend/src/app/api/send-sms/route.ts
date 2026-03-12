import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { getAdminDB } from "@/lib/firebase-admin";
import { detectCamNetwork, formatCamPhone } from "@/lib/phone-utils";
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

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
            return NextResponse.json(
                { error: "Twilio environment variables are not configured." },
                { status: 500 }
            );
        }

        const client = twilio(accountSid, authToken);
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
                const personalised = template.replace(/{name}/gi, citizen.fullName ?? "");
                const phone = formatCamPhone(citizen.phoneNumber ?? "");
                const network = detectCamNetwork(phone);

                const msg = await client.messages.create({
                    body: personalised,
                    from: fromNumber,
                    to: phone,
                });

                await db.collection("sms_logs").add({
                    citizenId,
                    citizenName: citizen.fullName,
                    phoneNumber: phone,
                    message: personalised,
                    network,
                    status: "sent",
                    sid: msg.sid,
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
