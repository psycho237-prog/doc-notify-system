const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * Normalises a phone number to +237 international format.
 * Guarantees that the phone number starts with +237.
 */
function formatCamPhone(phone) {
    if (!phone) return "";
    const clean = phone.replace(/\s+|-|\(|\)/g, "");
    if (clean.startsWith("+237")) return clean;
    if (clean.startsWith("237")) return `+${clean}`;
    if (clean.startsWith("+")) {
        return `+237${clean.substring(1)}`;
    }
    return `+237${clean}`;
}

/**
 * Sanitizes an SMS message by removing special characters, converting accents,
 * and maintaining structure and variables.
 */
function sanitizeSmsMessage(text) {
    if (!text) return "";
    
    // 1. Normalize accents (convert é/è/ê/ë to e, à/â to a, ç to c, etc.)
    let sanitized = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // removes diacritics
        
    // 2. Custom replacements for specific characters that might not normalize cleanly
    const replacements = {
        'œ': 'oe', 'Œ': 'OE', 'æ': 'ae', 'Æ': 'AE',
        'ç': 'c', 'Ç': 'C', 'ñ': 'n', 'Ñ': 'N',
        '’': "'", '‘': "'", '`': "'", '“': '"', '”': '"',
        '–': '-', '—': '-'
    };
    
    for (const [key, value] of Object.entries(replacements)) {
        sanitized = sanitized.split(key).join(value);
    }

    // 3. Keep only basic printable ASCII characters (GSM-7 safe)
    sanitized = sanitized.replace(/[^\x20-\x7E\r\n]/g, "");
    
    return sanitized;
}

/**
 * Detects the Cameroon phone network based on prefix
 * @param {string} phoneNumber 
 * @returns {string} MTN | Orange | Camtel | Unknown
 */
function detectNetwork(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/^\+237/, '');
    const prefix2 = cleanNumber.substring(0, 2);

    if (['67', '68'].includes(prefix2)) return 'MTN';
    if (['65', '69'].includes(prefix2)) return 'Orange';
    if (prefix2 === '62') return 'Camtel';

    return 'Unknown';
}

/**
 * Cloud Function to send bulk SMS
 * Triggered via HTTPS Callable
 */
exports.sendBulkSMS = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { citizenIds, templates, institutionId } = data;
    const MBOASMS_API_KEY = process.env.MBOASMS_API_KEY || "mboa_e4838de095f741dbace47138fa4765bb";
    const MBOASMS_SENDER_ID = process.env.MBOASMS_SENDER_ID || "DocNotify";

    if (!MBOASMS_API_KEY) {
        throw new functions.https.HttpsError('failed-precondition', 'MboaSMS API Key is not configured.');
    }

    const results = [];

    for (const citizenId of citizenIds) {
        try {
            const citizenDoc = await db.collection('citizens').doc(citizenId).get();
            if (!citizenDoc.exists) continue;

            const citizen = citizenDoc.data();
            if (citizen.institutionId !== institutionId) continue;

            const messageTemplate = citizen.language === 'FR' ? templates.messageFR : templates.messageEN;
            const personalizedMessage = sanitizeSmsMessage(messageTemplate.replace(/{name}/g, citizen.fullName));

            const network = detectNetwork(citizen.phoneNumber);

            const phone = formatCamPhone(citizen.phoneNumber);

            // Send SMS via MboaSMS developer API
            const response = await fetch("https://api.mboasms.com/api/v1/developer/sms/send", {
                method: "POST",
                headers: {
                    "X-API-Key": MBOASMS_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    phoneNumbers: [phone],
                    message: personalizedMessage,
                    senderId: MBOASMS_SENDER_ID,
                }),
            });

            const responseData = await response.json();
            if (!response.ok || !responseData.success) {
                throw new Error(responseData.message || responseData.error?.details || "Failed to send SMS via MboaSMS");
            }

            const sid = `mboa_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

            // Log the SMS
            const logEntry = {
                citizenId,
                phoneNumber: citizen.phoneNumber,
                message: personalizedMessage,
                network,
                status: 'sent',
                sid: sid,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                institutionId
            };

            await db.collection('sms_logs').add(logEntry);
            results.push({ citizenId, status: 'success', sid: sid });

        } catch (error) {
            console.error(`Failed to send SMS to ${citizenId}:`, error);
            results.push({ citizenId, status: 'error', error: error.message });

            // Log failure
            await db.collection('sms_logs').add({
                citizenId,
                status: 'failed',
                error: error.message,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                institutionId
            });
        }
    }

    return { success: true, results };
});
