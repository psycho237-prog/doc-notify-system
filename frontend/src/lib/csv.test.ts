import { describe, it, expect } from "vitest";
import { buildCsv, todayStamp } from "./csv";

describe("buildCsv", () => {
    it("joins headers and rows", () => {
        const csv = buildCsv(["Nom", "Téléphone"], [
            ["Jean Dupont", "+237691234567"],
            ["Amina Bello", "+237678555102"],
        ]);
        expect(csv).toBe(
            "Nom,Téléphone\nJean Dupont,+237691234567\nAmina Bello,+237678555102"
        );
    });

    it("quotes values containing commas", () => {
        const csv = buildCsv(["A"], [["hello, world"]]);
        expect(csv).toBe('A\n"hello, world"');
    });

    it("escapes double quotes by doubling them", () => {
        const csv = buildCsv(["A"], [['say "hi"']]);
        expect(csv).toBe('A\n"say ""hi"""');
    });

    it("quotes values containing newlines", () => {
        const csv = buildCsv(["A"], [["line1\nline2"]]);
        expect(csv).toBe('A\n"line1\nline2"');
    });

    it("renders null/undefined as empty cells", () => {
        const csv = buildCsv(["A", "B"], [[null, undefined]]);
        expect(csv).toBe("A,B\n,");
    });

    it("handles empty rows", () => {
        expect(buildCsv(["A"], [])).toBe("A");
    });
});

describe("todayStamp", () => {
    it("returns a yyyy-mm-dd date string", () => {
        expect(todayStamp()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
