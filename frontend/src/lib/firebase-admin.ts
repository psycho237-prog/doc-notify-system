import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

/**
 * True only when a usable Firebase service account is available server-side.
 * Used by API routes to decide whether to write to Firestore.
 */
export function isAdminConfigured(): boolean {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) return false;
    try {
        const parsed = JSON.parse(raw);
        return !!(parsed && parsed.project_id && parsed.client_email && parsed.private_key);
    } catch {
        return false;
    }
}

export function getAdminApp(): App {
    if (getApps().length === 0) {
        const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}"
        );
        app = initializeApp({
            credential: cert(serviceAccount),
        });
    } else {
        app = getApps()[0];
    }
    return app;
}

export function getAdminDB() {
    getAdminApp();
    return getFirestore();
}
