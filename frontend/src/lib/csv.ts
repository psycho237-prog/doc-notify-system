/**
 * CSV helpers shared by the history and contacts export buttons.
 * Values are escaped per RFC-4180 and the file is UTF-8 with BOM so Excel
 * displays accented characters (é, è, à...) correctly.
 */

export type CsvCell = string | number | null | undefined;

function escapeCell(value: CsvCell): string {
    const s = value === null || value === undefined ? "" : String(value);
    // Quote only when necessary (contains comma, quote or line break).
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Builds a CSV string from headers and rows. */
export function buildCsv(headers: string[], rows: CsvCell[][]): string {
    return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
}

/** Triggers a browser download of the CSV content. */
export function downloadCsv(
    filename: string,
    headers: string[],
    rows: CsvCell[][]
): void {
    if (typeof window === "undefined") return;
    const blob = new Blob(["\uFEFF" + buildCsv(headers, rows)], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Defer revocation so the download can start on all browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "2026-08-03" style LOCAL date used in default export filenames. */
export function todayStamp(): string {
    return new Date().toLocaleDateString("en-CA"); // en-CA → YYYY-MM-DD
}
