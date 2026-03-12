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
 * Accepts bare 9-digit Cameroonian numbers or already formatted +237... numbers.
 */
export function formatCamPhone(phone: string): string {
    const clean = phone.replace(/\s+|-|\(|\)/g, "");
    if (clean.startsWith("+237")) return clean;
    if (clean.startsWith("237")) return `+${clean}`;
    if (clean.length === 9) return `+237${clean}`;
    return clean; // return as-is if not recognisable
}
