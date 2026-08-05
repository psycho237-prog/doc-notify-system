export type SendStatus = "sent" | "failed" | "queued";
export type UserRole = "superadmin" | "user";

export interface Recipient {
    id: string;
    name: string;
    phone: string;
    createdAt: string;
}

export interface SmsLog {
    id: string;
    name: string;
    phone: string;
    message: string;
    status: SendStatus;
    error?: string;
    sentAt: string;
    /** Set when the log entry was created from an offline queued send. */
    pendingId?: string;
}

export interface SendResultItem {
    name: string;
    phone: string;
    status: SendStatus;
    message?: string;
    error?: string;
}

export interface SendSummary {
    success: boolean;
    sent: number;
    failed: number;
    /** Number of recipients stored for later (offline send). */
    queued?: number;
    /** Number of directory contacts removed after the send. */
    cleaned?: number;
    results: SendResultItem[];
}

export interface Stats {
    totalContacts: number;
    sentToday: number;
    totalSent: number;
    failedTotal: number;
    successRate: number;
    queued: number;
}

export interface Settings {
    institutionName: string;
    simulateSms: boolean;
    /** Admin-controlled: remove the notified numbers from the directory after a send. */
    cleanupAfterSend: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    institutionName: "NNLOMNE Administrative",
    simulateSms: false,
    cleanupAfterSend: true,
};

/** A user account. `password` is only stored/used in local (demo) mode. */
export interface UserAccount {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    createdAt: string;
    /** Temporarily locked by the super admin: the account cannot sign in. */
    disabled?: boolean;
}

/** A member snapshot inside a notification group (survives directory cleanup). */
export interface GroupMember {
    id: string;
    name: string;
    phone: string;
}

/** A notification group: a named snapshot of recipients. */
export interface Group {
    id: string;
    name: string;
    members: GroupMember[];
    createdAt: string;
}

/** An SMS send stored locally because the device was offline. */
export interface PendingSend {
    id: string;
    /** Account that queued the send (kept so the flush targets the right data). */
    userId: string;
    recipients: { name: string; phone: string }[];
    message: string;
    simulate: boolean;
    createdAt: string;
}
