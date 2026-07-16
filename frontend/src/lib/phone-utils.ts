/**
 * Detects the Cameroonian mobile network based on phone number prefix.
 * Prefixes (after removing country code +237):
 *   67, 68 → MTN
 *   65, 69 → Orange
 *   62     → Camtel
 */
export function detectCamNetwork(phoneNumber: string): string {
    const clean = phoneNumber.replace(/\s+|-/g, "").replace(/^\+237/, "");
    const prefix = clean.substring(0, 2);
    if (["67", "68"].includes(prefix)) return "MTN";
    if (["65", "69"].includes(prefix)) return "Orange";
    if (prefix === "62") return "Camtel";
    return "Unknown";
}

/**
 * Normalises a phone number to +237 international format.
 * Guarantees that the phone number starts with +237.
 */
export function formatCamPhone(phone: string): string {
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
export function sanitizeSmsMessage(text: string): string {
    if (!text) return "";
    
    // 1. Normalize accents (convert é/è/ê/ë to e, à/â to a, ç to c, etc.)
    let sanitized = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // removes diacritics
        
    // 2. Custom replacements for specific characters that might not normalize cleanly
    const replacements: Record<string, string> = {
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
