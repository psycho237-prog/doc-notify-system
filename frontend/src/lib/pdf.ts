/**
 * Zero-dependency PDF report generator.
 *
 * Produces a valid A4 PDF with a styled table (header, alternating rows,
 * status colors, pagination, header + footer on every page). Built-in
 * Helvetica fonts are used with WinAnsi encoding, which covers French
 * accents (é, è, à, ç, ô...).
 */

export type PdfStatus = "sent" | "failed" | "queued";

export interface PdfLogRow {
    name: string;
    phone: string;
    date: string; // dd/mm/yyyy
    time: string; // HH:MM
    message: string;
    status: PdfStatus;
}

export interface PdfReportOptions {
    institution: string;
    account: string;
    period: string;
    generatedAt: string;
    rows: PdfLogRow[];
    labels: {
        report: string;
        accountLabel: string;
        periodLabel: string;
        generatedLabel: string;
        page: string;
        status: string;
        name: string;
        phone: string;
        date: string;
        time: string;
        message: string;
        sent: string;
        failed: string;
        queued: string;
    };
}

/* ── Helvetica glyph widths (units of 1/1000 em, chars 32..126) ──── */
const HELVETICA_WIDTHS = (
    "278 278 355 556 556 556 556 556 556 556 278 278 355 556 556 889 " +
    "667 191 333 333 389 584 278 333 278 278 278 278 584 584 584 556 " +
    "1015 667 667 722 722 667 611 778 722 278 500 667 556 833 722 778 " +
    "667 778 722 667 611 722 667 944 667 667 611 278 278 278 469 556 " +
    "333 556 556 500 556 556 278 556 556 222 222 500 222 833 556 556 " +
    "556 556 333 500 278 556 500 722 500 500 500 334 260 334 584"
)
    .split(" ")
    .map(Number);

function charWidth(ch: string, bold: boolean): number {
    const code = ch.charCodeAt(0);
    const w = code >= 32 && code <= 126 ? HELVETICA_WIDTHS[code - 32] : 556;
    return bold ? Math.round(w * 1.08) : w;
}

function textWidth(text: string, size: number, bold: boolean): number {
    let units = 0;
    for (const ch of text) units += charWidth(ch, bold);
    return (units * size) / 1000;
}

/* ── WinAnsi encoding ─────────────────────────────────────────────── */

const WIN_ANSI_EXTRA: Record<number, number> = {
    0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
    0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
    0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
    0x017e: 0x9e, 0x0178: 0x9f,
};

function toWinAnsiByte(ch: string): number {
    const code = ch.codePointAt(0) ?? 0x3f;
    if (code <= 0x7f) return code;
    if (code >= 0xa0 && code <= 0xff) return code; // Latin-1 == WinAnsi here
    if (WIN_ANSI_EXTRA[code] !== undefined) return WIN_ANSI_EXTRA[code];
    const stripped = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (stripped.length === 1) {
        const c2 = stripped.charCodeAt(0);
        if (c2 <= 0x7f) return c2;
    }
    return 0x3f; // "?"
}

/** Escapes a string into a PDF literal string (single-byte WinAnsi). */
function pdfString(text: string): string {
    let out = "(";
    for (const ch of text) {
        const b = toWinAnsiByte(ch);
        if (b === 0x28 || b === 0x29 || b === 0x5c) out += "\\" + String.fromCharCode(b);
        else if (b === 0x0a) out += "\\n";
        else if (b === 0x0d) out += "\\r";
        else out += String.fromCharCode(b);
    }
    return out + ")";
}

/* ── Layout constants ─────────────────────────────────────────────── */

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2; // 515.28

const COL_N = 24;
const COL_NAME = 100;
const COL_PHONE = 75;
const COL_DATE = 60;
const COL_TIME = 40;
const COL_STATUS = 55;
const COL_MESSAGE = CONTENT_W - COL_N - COL_NAME - COL_PHONE - COL_DATE - COL_TIME - COL_STATUS;

const HEADER_BG: [number, number, number] = [30, 58, 138];
const ALT_BG: [number, number, number] = [241, 245, 249];
const BODY: [number, number, number] = [31, 41, 55];
const GRAY: [number, number, number] = [107, 114, 128];
const STATUS_COLOR: Record<PdfStatus, [number, number, number]> = {
    sent: [22, 163, 74],
    failed: [220, 38, 38],
    queued: [217, 119, 6],
};

function wrapText(text: string, maxWidth: number, size: number, bold: boolean): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (textWidth(candidate, size, bold) <= maxWidth || !current) {
            current = candidate;
        } else {
            lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
}

/* ── PDF builder ─────────────────────────────────────────────────── */

const rgb = (c: [number, number, number]) => `${(c[0] / 255).toFixed(3)} ${(c[1] / 255).toFixed(3)} ${(c[2] / 255).toFixed(3)}`;

function fmtNum(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function buildSmsReportPdf(opts: PdfReportOptions): string {
    const { labels } = opts;
    const lineHeight = 13.5;
    const fontSize = 9;

    const pages: string[][] = [[]];
    let page = pages[0];

    /* ── Helpers that write to the current page ── */
    const fillRect = (x: number, y: number, w: number, h: number, c: [number, number, number]) =>
        page.push(`${rgb(c)} rg ${fmtNum(x)} ${fmtNum(y)} ${fmtNum(w)} ${fmtNum(h)} re f`);
    const text = (
        x: number,
        y: number,
        str: string,
        size: number,
        bold: boolean,
        c: [number, number, number]
    ) =>
        page.push(
            `${rgb(c)} rg BT /F${bold ? 2 : 1} ${fmtNum(size)} Tf 1 0 0 1 ${fmtNum(x)} ${fmtNum(y)} Tm ${pdfString(str)} Tj ET`
        );
    const newPage = () => {
        pages.push([]);
        page = pages[pages.length - 1];
    };

    /* ── Document header + footer ── */
    const drawHeader = (pageNum: number) => {
        text(MARGIN, PAGE_H - 56, opts.institution, 15, true, HEADER_BG);
        text(MARGIN, PAGE_H - 68, labels.report, 9, false, GRAY);
        text(MARGIN, PAGE_H - 79, `${labels.accountLabel}: ${opts.account}`, 9, false, GRAY);
        text(MARGIN, PAGE_H - 90, `${labels.periodLabel}: ${opts.period}`, 9, false, GRAY);
        fillRect(MARGIN, PAGE_H - 98, CONTENT_W, 2.2, HEADER_BG);
        const genW = textWidth(opts.generatedAt, 8, false);
        text(PAGE_W - MARGIN - genW, PAGE_H - 56, opts.generatedAt, 8, false, GRAY);
        const right = textWidth(`${labels.page} ${pageNum}`, 8, false);
        text(PAGE_W - MARGIN - right, 30, `${labels.page} ${pageNum}`, 8, false, GRAY);
    };

    const drawTableHeader = (y: number) => {
        fillRect(MARGIN, y, CONTENT_W, 20, HEADER_BG);
        let x = MARGIN;
        const cell = (w: number, label: string) => {
            text(x + 4, y + 13.5, label, 8.5, true, [255, 255, 255]);
            x += w;
        };
        cell(COL_N, "#");
        cell(COL_NAME, labels.name);
        cell(COL_PHONE, labels.phone);
        cell(COL_DATE, labels.date);
        cell(COL_TIME, labels.time);
        cell(COL_MESSAGE, labels.message);
        cell(COL_STATUS, labels.status);
    };

    /* ── Rows ── */
    const statusLabel: Record<PdfStatus, string> = {
        sent: labels.sent,
        failed: labels.failed,
        queued: labels.queued,
    };

    let y = PAGE_H - 112; // first table header top
    let pageNum = 1;
    drawHeader(pageNum);
    drawTableHeader(y);
    y -= 20;

    opts.rows.forEach((row, i) => {
        const msgLines = wrapText(row.message, COL_MESSAGE - 8, fontSize, false);
        const rowHeight = Math.max(16, msgLines.length * lineHeight + 6);

        if (y - rowHeight < 52) {
            newPage();
            pageNum++;
            y = PAGE_H - 112;
            drawHeader(pageNum);
            drawTableHeader(y);
            y -= 20;
        }

        if (i % 2 === 1) fillRect(MARGIN, y, CONTENT_W, rowHeight, ALT_BG);

        let x = MARGIN;
        const cell = (w: number, str: string, size: number, bold: boolean, c: [number, number, number]) => {
            text(x + 4, y + rowHeight - 5.5, str, size, bold, c);
            x += w;
        };

        cell(COL_N, String(i + 1), 8, false, BODY);
        cell(COL_NAME, row.name, fontSize, false, BODY);
        cell(COL_PHONE, row.phone, fontSize, false, BODY);
        cell(COL_DATE, row.date, 8, false, BODY);
        cell(COL_TIME, row.time, 8, false, BODY);

        // Message (wrapped, between time and status columns)
        msgLines.forEach((line, li) => {
            text(MARGIN + COL_N + COL_NAME + COL_PHONE + COL_DATE + COL_TIME + 4, y + rowHeight - 5.5 - li * lineHeight, line, fontSize, false, BODY);
        });

        x += COL_MESSAGE;
        cell(COL_STATUS, statusLabel[row.status], 8.5, true, STATUS_COLOR[row.status]);
        y -= rowHeight;
    });

    /* ── Assemble the PDF file ──
     * Object numbering: 1 Catalog, 2 Pages, 3 Font(F1), 4 Font(F2),
     * then page i = 5 + 2i and its content stream = 6 + 2i.
     */
    const objects: string[] = [];
    objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[1] = `<< /Type /Pages /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`;
    objects[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

    pages.forEach((content, i) => {
        const pageObj = 5 + i * 2;
        const contentObj = pageObj + 1;
        const stream = content.join("\n");
        objects[pageObj - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObj} 0 R >>`;
        objects[contentObj - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });

    // All object strings only contain single-byte characters (ASCII ops +
    // WinAnsi-escaped text), so string length == byte length.
    const lineLength = (arr: string[]): number => arr.join("\n").length + 1;

    const lines: string[] = ["%PDF-1.4"];
    const offsets: number[] = [0];
    objects.forEach((obj, i) => {
        offsets.push(lineLength(lines));
        lines.push(`${i + 1} 0 obj`);
        lines.push(obj);
        lines.push("endobj");
    });

    const xrefStart = lineLength(lines);
    lines.push("xref");
    lines.push(`0 ${objects.length + 1}`);
    lines.push("0000000000 65535 f  ");
    for (let i = 0; i < objects.length; i++) {
        lines.push(`${String(offsets[i + 1]).padStart(10, "0")} 00000 n  `);
    }
    lines.push("trailer");
    lines.push(`<< /Size ${objects.length + 1} /Root 1 0 R >>`);
    lines.push("startxref");
    lines.push(String(xrefStart));
    lines.push("%%EOF");

    return lines.join("\n") + "\n";
}

/** Converts the latin-1 PDF string to raw bytes (browser-safe, no Buffer). */
export function pdfToBytes(pdf: string): Uint8Array {
    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return bytes;
}

/** Builds + downloads the report (browser only). */
export function downloadSmsReportPdf(filename: string, opts: PdfReportOptions): void {
    downloadBlob(filename, pdfToBytes(buildSmsReportPdf(opts)));
}

/* ── Browser download helper ─────────────────────────────────────── */

export function downloadBlob(filename: string, bytes: Uint8Array, mime = "application/pdf"): void {
    if (typeof window === "undefined") return;
    // Copy into a fresh ArrayBuffer-backed view (newer TS libs type the
    // parameter as Uint8Array<ArrayBuffer>; also drops any subarray offset).
    const blob = new Blob([new Uint8Array(bytes)], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Formats an ISO timestamp into { date, time } pairs (FR-friendly). */
export function formatPdfDate(iso: string): { date: string; time: string } {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { date: "—", time: "—" };
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
        date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
}
