/**
 * Cameroonian phone + SMS helpers.
 *
 * - detectCamNetwork: MTN / Orange / Camtel from the number prefix
 * - formatCamPhone: normalises any input to +237 international format
 * - isValidCamPhone: validates a Cameroonian mobile number
 * - sanitizeSmsMessage: removes accents and special characters so the final
 *   SMS contains only safe GSM-printable characters (no accents, emoji,
 *   smart quotes, braces, etc.)
 * - parseRecipientsText: parses pasted recipient lines ("Name; phone")
 */

/** Strips spaces, dashes, dots and parentheses, keeps "+". */
export function normalizeCamPhone(phone: string): string {
    return phone.replace(/[\s\-().]/g, "");
}

/**
 * Detects the Cameroonian mobile network based on phone number prefix.
 * Prefixes (after removing country code +237):
 *   67, 68 → MTN
 *   65, 69 → Orange
 *   62     → Camtel
 */
export function detectCamNetwork(phoneNumber: string): string {
    const clean = normalizeCamPhone(phoneNumber).replace(/^\+237/, "");
    const prefix = clean.substring(0, 2);
    if (["67", "68"].includes(prefix)) return "MTN";
    if (["65", "69"].includes(prefix)) return "Orange";
    if (prefix === "62") return "Camtel";
    return "Inconnu";
}

/**
 * Normalises a phone number to +237 international format.
 * Guarantees that the phone number starts with +237.
 */
export function formatCamPhone(phone: string): string {
    if (!phone) return "";
    const clean = normalizeCamPhone(phone);
    if (clean.startsWith("+237")) return clean;
    if (clean.startsWith("237")) return `+${clean}`;
    if (clean.startsWith("+")) {
        return `+237${clean.substring(1)}`;
    }
    return `+237${clean}`;
}

/** Validates a Cameroonian mobile number (MTN / Orange / Camtel).
 *  Accepts both local format (696814391) and international (+237696814391). */
export function isValidCamPhone(phone: string): boolean {
    const clean = normalizeCamPhone(phone).replace(/^\+/, "");
    return /^(237)?[69]\d{8}$/.test(clean);
}

/**
 * Sanitizes an SMS message: removes accents and special characters so the
 * final message only contains safe printable ASCII.
 */
export function sanitizeSmsMessage(text: string): string {
    if (!text) return "";

    // 1. Normalize accents (convert é/è/ê/ë to e, à/â to a, ç to c, etc.)
    let sanitized = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // removes diacritics

    // 2. Custom replacements for characters that do not normalize cleanly
    const replacements: Record<string, string> = {
        "œ": "oe", "Œ": "OE", "æ": "ae", "Æ": "AE",
        "ç": "c", "Ç": "C", "ñ": "n", "Ñ": "N",
        "’": "'", "‘": "'", "`": "'", "“": '"', "”": '"',
        "–": "-", "—": "-", "…": "...", "«": '"', "»": '"',
    };

    for (const [key, value] of Object.entries(replacements)) {
        sanitized = sanitized.split(key).join(value);
    }

    // 3. Remove "structural" special characters entirely (braces, brackets,
    //    pipes, backslashes, carets, tildes, asterisks, tags...)
    sanitized = sanitized.replace(/[{}[\]|\\^~<>*]/g, "");

    // 4. Keep only safe printable ASCII (letters, digits, basic punctuation)
    sanitized = sanitized.replace(/[^\x20-\x7E\r\n]/g, "");

    // 5. Collapse repeated spaces
    sanitized = sanitized.replace(/ {2,}/g, " ").trim();

    return sanitized;
}

export interface ParsedRecipient {
    line: number;
    name: string;
    phone: string;
    valid: boolean;
}

/**
 * Removes the first line whose normalized phone matches `phone` from a
 * pasted recipients text (e.g. when dismissing a contact from the import
 * banner). Returns the text unchanged if no line matches.
 */
export function removeRecipientLine(text: string, phone: string): string {
    const target = formatCamPhone(phone);
    const lines = text.split(/\r?\n/);
    const idx = lines.findIndex((line) => {
        const p = parseRecipientsText(line)[0];
        return p && p.valid && formatCamPhone(p.phone) === target;
    });
    if (idx === -1) return text;
    lines.splice(idx, 1);
    return lines.join("\n");
}

/**
 * Parses pasted recipient lines. Each line must contain a name and a phone
 * number, separated by ";", ",", "|" or a tab (e.g. "Jean Dupont; 691234567").
 */
export function parseRecipientsText(text: string): ParsedRecipient[] {
    return text
        .split(/\r?\n/)
        .map((raw, i) => {
            const line = raw.trim();
            if (!line) return null;

            const parts = line.split(/[;,\t|]/).map((p) => p.trim()).filter(Boolean);
            let name = "";
            let phone = "";

            if (parts.length >= 2) {
                phone = parts[parts.length - 1];
                name = parts.slice(0, -1).join(" ");
            } else {
                // A single part is not enough: we need a name AND a phone.
                name = line;
                phone = "";
            }

            return {
                line: i + 1,
                name: name.trim(),
                phone: phone.trim(),
                valid: !!name.trim() && isValidCamPhone(phone),
            };
        })
        .filter((x): x is ParsedRecipient => x !== null);
}
