import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {};

// PWA guard: warn loudly when the required PNG icons are missing. Without them
// the app is not installable and the service worker shell cannot be precached.
// Runs on every `next dev` / `next build` / `next start`.
const REQUIRED_PWA_ICONS = ["icon-192.png", "icon-512.png"];
const iconsDir = join(dirname(fileURLToPath(import.meta.url)), "public", "icons");
const missingIcons = REQUIRED_PWA_ICONS.filter((name) => !existsSync(join(iconsDir, name)));
if (missingIcons.length > 0) {
    console.warn(
        [
            "",
            "⚠️  PWA icons missing in public/icons/: " + missingIcons.join(", "),
            "   The app will NOT be installable and offline caching will break.",
            "   Generate them with:  node ../scripts/generate-icons.mjs   (from the frontend/ directory)",
            "   (npm run build generates them automatically via the prebuild hook)",
            "",
        ].join("\n")
    );
}

export default nextConfig;
