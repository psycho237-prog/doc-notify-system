/**
 * Generates PWA icons (192x192 and 512x512 PNG) with zero dependencies.
 *
 * The icon: a vertical blue gradient background (#1e3a8a -> #1e1b4b) with a
 * white bell silhouette in the center. PNG encoding is done manually with
 * Node's built-in zlib.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "frontend", "public", "icons");
mkdirSync(OUT_DIR, { recursive: true });

/* ── Minimal PNG encoder (RGBA, 8-bit, no interlace) ─────────────── */

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    const stride = width * 4;
    const raw = Buffer.alloc((stride + 1) * height);
    for (let y = 0; y < height; y++) {
        raw[y * (stride + 1)] = 0; // filter: none
        rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
    }
    const idat = deflateSync(raw, { level: 9 });

    return Buffer.concat([
        sig,
        pngChunk("IHDR", ihdr),
        pngChunk("IDAT", idat),
        pngChunk("IEND", Buffer.alloc(0)),
    ]);
}

/* ── Icon drawing ─────────────────────────────────────────────────── */

const hex = (h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
];
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

const TOP = hex("#1e3a8a");
const BOTTOM = hex("#1e1b4b");
const WHITE = [255, 255, 255];

/** Bell silhouette test in normalized [0,1]² coordinates. */
function inBell(nx, ny) {
    const cx = 0.5;
    // Dome
    const domeCy = 0.245;
    const domeR = 0.185;
    // Body (flared skirt)
    const bodyTop = 0.245;
    const bodyBottom = 0.66;
    const halfTop = 0.155;
    const halfBottom = 0.2;
    // Clapper
    const clapCy = 0.755;
    const clapR = 0.052;

    // rounded bottom of the body
    const bottomR = 0.05;
    const bodyHalf = (y) => {
        const t = (y - bodyTop) / (bodyBottom - bodyTop);
        const w = halfTop + (halfBottom - halfTop) * t;
        // flare the last bit
        return w + (y > bodyBottom - bottomR ? (y - (bodyBottom - bottomR)) * 0.15 : 0);
    };

    const dx = Math.abs(nx - cx);

    // Dome circle
    const dyDome = ny - domeCy;
    if (dx * dx + dyDome * dyDome <= domeR * domeR) return true;

    // Body
    if (ny >= bodyTop && ny <= bodyBottom) {
        const half = bodyHalf(ny);
        if (dx <= half) return true;
        // rounded corners at the bottom
        if (ny > bodyBottom - bottomR) {
            const cy = bodyBottom - bottomR;
            const cdx = dx - (half - 0);
            const cdy = ny - cy;
            if (cdx >= 0 && cdy >= 0 && cdx * cdx + cdy * cdy <= bottomR * bottomR) return true;
        }
    }

    // Clapper
    const dyClap = ny - clapCy;
    if (dx * dx + dyClap * dyClap <= clapR * clapR) return true;

    return false;
}

function renderIcon(size) {
    const rgba = Buffer.alloc(size * size * 4);
    const pad = size * 0.02; // slight edge padding
    for (let y = 0; y < size; y++) {
        const t = y / (size - 1);
        const bg = mix(TOP, BOTTOM, t);
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const nx = (x + 0.5) / size;
            const ny = (y + 0.5) / size;
            let color = bg;
            if (nx > pad / size && nx < 1 - pad / size && ny > pad / size && ny < 1 - pad / size) {
                if (inBell(nx, ny)) color = WHITE;
            }
            rgba[i] = color[0];
            rgba[i + 1] = color[1];
            rgba[i + 2] = color[2];
            rgba[i + 3] = 255;
        }
    }
    return encodePng(size, size, rgba);
}

writeFileSync(join(OUT_DIR, "icon-512.png"), renderIcon(512));
writeFileSync(join(OUT_DIR, "icon-192.png"), renderIcon(192));

// Verify the outputs actually landed and look like real PNGs — fail loudly
// instead of silently shipping a build with a broken, non-installable PWA.
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
for (const name of ["icon-512.png", "icon-192.png"]) {
    const p = join(OUT_DIR, name);
    const buf = existsSync(p) ? readFileSync(p) : null;
    if (!buf || buf.length < 1000 || !buf.subarray(0, 8).equals(PNG_SIG)) {
        throw new Error(`Icon generation failed: ${p} is missing, too small, or not a valid PNG`);
    }
}

console.log("Icons written to", OUT_DIR);
