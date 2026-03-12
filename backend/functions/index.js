const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

admin.initializeApp();
const db = admin.firestore();

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
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        throw new functions.https.HttpsError('failed-precondition', 'Twilio environment variables are not set.');
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const results = [];

    for (const citizenId of citizenIds) {
        try {
            const citizenDoc = await db.collection('citizens').doc(citizenId).get();
            if (!citizenDoc.exists) continue;

            const citizen = citizenDoc.data();
            if (citizen.institutionId !== institutionId) continue;

            const messageTemplate = citizen.language === 'FR' ? templates.messageFR : templates.messageEN;
            const personalizedMessage = messageTemplate.replace(/{name}/g, citizen.fullName);

            const network = detectNetwork(citizen.phoneNumber);

            // Send SMS via Twilio
            const message = await client.messages.create({
                body: personalizedMessage,
                from: TWILIO_PHONE_NUMBER,
                to: citizen.phoneNumber.startsWith('+') ? citizen.phoneNumber : `+237${citizen.phoneNumber}`
            });

            // Log the SMS
            const logEntry = {
                citizenId,
                phoneNumber: citizen.phoneNumber,
                message: personalizedMessage,
                network,
                status: 'sent',
                sid: message.sid,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                institutionId
            };

            await db.collection('sms_logs').add(logEntry);
            results.push({ citizenId, status: 'success', sid: message.sid });

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
