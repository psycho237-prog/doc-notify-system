import type { Recipient } from "./types";

const now = new Date().toISOString();

/** Demo contacts used the first time the app runs in local (demo) mode. */
export const SEED_RECIPIENTS: Recipient[] = [
    { id: "seed-1", name: "Jean-Paul Mbarga", phone: "+237 691 234 567", createdAt: now },
    { id: "seed-2", name: "Amina Bello", phone: "+237 678 555 102", createdAt: now },
    { id: "seed-3", name: "Paul Etoundi", phone: "+237 699 876 543", createdAt: now },
    { id: "seed-4", name: "Marie-Claire Ngo Bassa", phone: "+237 655 210 987", createdAt: now },
    { id: "seed-5", name: "Samuel Tchoupo", phone: "+237 682 444 991", createdAt: now },
    { id: "seed-6", name: "Brigitte Kamga", phone: "+237 696 777 333", createdAt: now },
];
