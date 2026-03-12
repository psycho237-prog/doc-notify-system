import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

function getAdminApp(): App {
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
