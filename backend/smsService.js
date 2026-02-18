const axios = require('axios');
require('dotenv').config();

const SMSTO_API_URL = 'https://api.sms.to/sms/send';
const API_KEY = process.env.SMSTO_API_KEY;

const sendSMS = async (to, message, gatewayId = null) => {
    if (API_KEY === 'your_actual_api_key_here' || !API_KEY) {
        console.warn('SMS.to API Key not configured. Mocking SMS send for:', to);
        return { success: true, message: 'Mocked SMS sent successfully' };
    }

    const payload = {
        to: to,
        from: process.env.SMSTO_SENDER_ID || 'DocNotify',
        message: message
    };

    if (gatewayId) {
        payload.gateway_id = gatewayId;
    }

    console.log(`Sending SMS to ${to} via ${SMSTO_API_URL}${gatewayId ? ' (Gateway: ' + gatewayId + ')' : ''}`);
    console.log(`Payload: ${JSON.stringify(payload)}`);

    try {
        const response = await axios.post(SMSTO_API_URL, payload, {
            headers: {
                'Authorization': `Bearer ${API_KEY.trim()}`,
                'Content-Type': 'application/json'
            },
            family: 4
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'SMS.to API error');
        }
        throw error;
    }
};

module.exports = { sendSMS };
