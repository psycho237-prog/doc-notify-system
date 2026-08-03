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
    status: "sent" | "failed";
    error?: string;
    sentAt: string;
}

export interface SendResultItem {
    name: string;
    phone: string;
    status: "sent" | "failed";
    message?: string;
    error?: string;
}

export interface SendSummary {
    success: boolean;
    sent: number;
    failed: number;
    results: SendResultItem[];
}

export interface Stats {
    totalContacts: number;
    sentToday: number;
    totalSent: number;
    failedTotal: number;
    successRate: number;
}

export interface Settings {
    institutionName: string;
    simulateSms: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    institutionName: "NNLOMNE Administrative",
    simulateSms: false,
};
