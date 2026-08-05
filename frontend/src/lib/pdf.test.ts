import { describe, it, expect } from "vitest";
import { buildSmsReportPdf, formatPdfDate, pdfToBytes } from "./pdf";

const BASE_OPTIONS = {
    institution: "NNLOMNE Administrative",
    account: "Agent A (agent@nnlomne.gov)",
    period: "Tout",
    generatedAt: "Généré le 05/08/2026",
    rows: [
        {
            name: "Jean Dupont",
            phone: "+237691234567",
            date: "05/08/2026",
            time: "10:00",
            message: "Bonjour Jean, votre document est pret. Merci de venir le retirer au guichet.",
            status: "sent" as const,
        },
        {
            name: "Amina Bello",
            phone: "+237678555102",
            date: "05/08/2026",
            time: "13:00",
            message: "Bonjour Amina, votre document est pret.",
            status: "queued" as const,
        },
    ],
    labels: {
        report: "Rapport des notifications",
        accountLabel: "Compte",
        periodLabel: "Période",
        generatedLabel: "Généré le",
        page: "Page",
        status: "Statut",
        name: "Nom",
        phone: "Numéro",
        date: "Date",
        time: "Heure",
        message: "Message",
        sent: "Envoyé",
        failed: "Échoué",
        queued: "En attente",
    },
};

describe("buildSmsReportPdf", () => {
    it("produces a valid PDF structure", () => {
        const pdf = buildSmsReportPdf(BASE_OPTIONS);
        expect(pdf.startsWith("%PDF-1.4")).toBe(true);
        expect(pdf).toContain("/Type /Catalog");
        expect(pdf).toContain("/Type /Page");
        expect(pdf).toContain("/BaseFont /Helvetica");
        expect(pdf).toContain("/BaseFont /Helvetica-Bold");
        expect(pdf).toContain("/WinAnsiEncoding");
        expect(pdf.endsWith("%%EOF\n")).toBe(true);
        expect(pdf).toContain("startxref");
    });

    it("references objects correctly (pages parent + kids)", () => {
        const pdf = buildSmsReportPdf(BASE_OPTIONS);
        // Page objects must point to the Pages node (object 2).
        const parents = pdf.match(/\/Type \/Page \/Parent 2 0 R/g);
        expect(parents?.length).toBe(1);
        // The single page lives at object 5 with content at 6.
        expect(pdf).toContain("/Kids [5 0 R]");
        expect(pdf).toContain("/Contents 6 0 R");
        // Fonts stay at objects 3 and 4 (not overwritten by page dicts).
        expect(pdf).toContain("/F1 3 0 R /F2 4 0 R");
    });

    it("handles accented French text without throwing", () => {
        const pdf = buildSmsReportPdf({
            ...BASE_OPTIONS,
            rows: [
                {
                    name: "Élise Ngo Bassa",
                    phone: "+237699876543",
                    date: "05/08/2026",
                    time: "09:30",
                    message: "Réception de votre dossier réussi à 10h — merci.",
                    status: "failed" as const,
                },
            ],
        });
        expect(pdf).toContain("Ngo Bassa");
        expect(pdf.length).toBeGreaterThan(500);
    });

    it("paginates when there are many rows", () => {
        const rows = Array.from({ length: 120 }, (_, i) => ({
            name: `Contact ${i}`,
            phone: `+23769${String(1234567 + i).padStart(7, "0")}`,
            date: "05/08/2026",
            time: "10:00",
            message: "Votre document est pret, merci de venir le retirer au guichet numero 3.",
            status: ("sent" as const),
        }));
        const pdf = buildSmsReportPdf({ ...BASE_OPTIONS, rows });
        // multiple pages → several /Type /Page entries
        const pageCount = pdf.match(/\/Type \/Page\b/g)?.length ?? 0;
        expect(pageCount).toBeGreaterThan(1);
        // each page still references the Pages node correctly
        expect(pdf.match(/\/Type \/Page \/Parent 2 0 R/g)?.length).toBe(pageCount);
    });
});

describe("pdfToBytes", () => {
    it("converts the PDF string to single-byte bytes", () => {
        const pdf = buildSmsReportPdf(BASE_OPTIONS);
        const bytes = pdfToBytes(pdf);
        expect(bytes.length).toBe(pdf.length);
        // header magic
        expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe("%PDF");
    });
});

describe("formatPdfDate", () => {
    it("formats an ISO timestamp into date + time", () => {
        const { date, time } = formatPdfDate("2026-08-05T10:15:00.000Z");
        expect(date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
        expect(time).toMatch(/^\d{2}:\d{2}$/);
    });

    it("handles invalid dates", () => {
        expect(formatPdfDate("nope")).toEqual({ date: "—", time: "—" });
    });
});
