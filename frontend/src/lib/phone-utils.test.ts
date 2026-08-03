import { describe, it, expect } from "vitest";
import {
    formatCamPhone,
    isValidCamPhone,
    detectCamNetwork,
    sanitizeSmsMessage,
    parseRecipientsText,
    removeRecipientLine,
} from "./phone-utils";

describe("formatCamPhone", () => {
    it("normalizes local numbers to +237 format", () => {
        expect(formatCamPhone("691234567")).toBe("+237691234567");
        expect(formatCamPhone("6 91 23 45 67")).toBe("+237691234567");
        expect(formatCamPhone("237691234567")).toBe("+237691234567");
        expect(formatCamPhone("+237 691 234 567")).toBe("+237691234567");
    });

    it("handles empty input", () => {
        expect(formatCamPhone("")).toBe("");
    });
});

describe("isValidCamPhone", () => {
    it("accepts MTN / Orange / Camtel numbers in all formats", () => {
        expect(isValidCamPhone("+237691234567")).toBe(true);
        expect(isValidCamPhone("237678555102")).toBe(true);
        expect(isValidCamPhone("699876543")).toBe(true);
        expect(isValidCamPhone("655 210 987")).toBe(true);
        expect(isValidCamPhone("682444991")).toBe(true);
        expect(isValidCamPhone("+237 62 123 4567")).toBe(true);
    });

    it("rejects invalid numbers", () => {
        expect(isValidCamPhone("123456")).toBe(false);
        expect(isValidCamPhone("+33612345678")).toBe(false);
        expect(isValidCamPhone("")).toBe(false);
        expect(isValidCamPhone("ABC")).toBe(false);
        expect(isValidCamPhone("69123456")).toBe(false); // too short
        expect(isValidCamPhone("6912345678")).toBe(false); // too long
    });
});

describe("detectCamNetwork", () => {
    it("detects MTN, Orange and Camtel", () => {
        expect(detectCamNetwork("+237 67 123 456")).toBe("MTN");
        expect(detectCamNetwork("+237 68 123 456")).toBe("MTN");
        expect(detectCamNetwork("+237 65 123 456")).toBe("Orange");
        expect(detectCamNetwork("+237 69 123 456")).toBe("Orange");
        expect(detectCamNetwork("+237 62 123 456")).toBe("Camtel");
    });
});

describe("sanitizeSmsMessage", () => {
    it("removes accents", () => {
        expect(sanitizeSmsMessage("Bonjour déjà vu éàçù")).toBe("Bonjour deja vu eacu");
    });

    it("replaces smart quotes and dashes", () => {
        expect(sanitizeSmsMessage("l’été — «voilà»")).toBe(`l'ete - "voila"`);
    });

    it("removes emojis and symbols", () => {
        expect(sanitizeSmsMessage("Merci ✓ € ½ ©")).toBe("Merci");
    });

    it("removes braces, pipes and tags", () => {
        expect(sanitizeSmsMessage("Votre doc {X} | OK")).toBe("Votre doc X OK");
        expect(sanitizeSmsMessage("A <b>test</b>")).toBe("A btest/b");
    });

    it("keeps safe GSM punctuation", () => {
        expect(sanitizeSmsMessage("Test: 123 ABC, bonjour!")).toBe("Test: 123 ABC, bonjour!");
    });

    it("produces a fully clean personalized message (no special characters)", () => {
        const raw = "Bonjour Jean-Paul, votre dossier N°2024/45 est prêt ! ✓";
        const clean = sanitizeSmsMessage(raw);
        // every character must be safe printable ASCII
        expect(/[^\x20-\x7E]/.test(clean)).toBe(false);
        expect(clean).toBe("Bonjour Jean-Paul, votre dossier N2024/45 est pret !");
    });

    it("handles empty input", () => {
        expect(sanitizeSmsMessage("")).toBe("");
    });
});

describe("parseRecipientsText", () => {
    it("parses name/phone lines with various separators", () => {
        const result = parseRecipientsText(
            "Jean Dupont; 691234567\nAmina Bello, 678555102\nPaul Etoundi | 699876543"
        );
        expect(result).toHaveLength(3);
        expect(result.every((r) => r.valid)).toBe(true);
        expect(result[0].name).toBe("Jean Dupont");
        expect(result[0].phone).toBe("691234567");
        expect(result[2].name).toBe("Paul Etoundi");
    });

    it("flags lines without a valid phone number", () => {
        const result = parseRecipientsText("Jean Dupont\nMarie; 12345");
        expect(result).toHaveLength(2);
        expect(result[0].valid).toBe(false);
        expect(result[1].valid).toBe(false);
    });

    it("ignores empty lines", () => {
        const result = parseRecipientsText("\n\nJean; 691234567\n\n");
        expect(result).toHaveLength(1);
        expect(result[0].valid).toBe(true);
    });

    it("supports +237 formatted numbers", () => {
        const result = parseRecipientsText("Jean; +237 691 234 567");
        expect(result[0].valid).toBe(true);
    });

    it("returns an empty array for empty text", () => {
        expect(parseRecipientsText("")).toEqual([]);
    });
});

describe("removeRecipientLine", () => {
    const text = "Jean Dupont; 691234567\nAmina Bello, 678555102\nPaul Etoundi | 699876543";

    it("removes the first line matching the phone (any format)", () => {
        const result = removeRecipientLine(text, "+237 678 555 102");
        expect(result).toBe("Jean Dupont; 691234567\nPaul Etoundi | 699876543");
    });

    it("leaves the text unchanged when the phone is not present", () => {
        expect(removeRecipientLine(text, "+237655210987")).toBe(text);
    });

    it("removes only the first matching line when duplicated", () => {
        const dup = "Jean; 691234567\nAutre; 691234567";
        expect(removeRecipientLine(dup, "691234567")).toBe("Autre; 691234567");
    });

    it("handles empty text", () => {
        expect(removeRecipientLine("", "691234567")).toBe("");
    });
});
