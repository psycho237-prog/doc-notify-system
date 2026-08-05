import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Real project values (from the Firebase console). Env vars override when set.
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCVCKNF8tLd_v9kTmxISUyPefz_MPD9tU",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "nnlomne.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nnlomne",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "nnlomne.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "877968719449",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:877968719449:web:8cc0c77d3f0abbe369bb48",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-43STPH5SGZ",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
