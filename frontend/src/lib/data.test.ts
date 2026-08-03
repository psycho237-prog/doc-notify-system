import { describe, it, expect, beforeEach } from "vitest";
import {
    addRecipient,
    checkLocalPassword,
    clearLocalData,
    deleteRecipients,
    getLocalPassword,
    getLogs,
    getMode,
    getRecipients,
    getStats,
    seedLocalData,
    setLocalPassword,
    setPendingSelection,
    takePendingSelection,
} from "./data";
import { SEED_RECIPIENTS } from "./seed";

beforeEach(() => {
    localStorage.clear();
});

describe("data layer (local mode)", () => {
    it("runs in local mode during tests", () => {
        expect(getMode()).toBe("local");
    });

    it("seeds demo contacts on first run", async () => {
        seedLocalData();
        const recipients = await getRecipients();
        expect(recipients).toHaveLength(SEED_RECIPIENTS.length);
        expect(recipients[0].name).toBe("Jean-Paul Mbarga");
    });

    it("adds and formats recipients", async () => {
        const r = await addRecipient("Marie Claire", "699 876 543");
        expect(r.name).toBe("Marie Claire");
        expect(r.phone).toBe("+237699876543");
        expect(r.id).toBeTruthy();

        const recipients = await getRecipients();
        expect(recipients.some((c) => c.phone === "+237699876543")).toBe(true);
    });

    it("computes empty stats", async () => {
        const stats = await getStats();
        expect(stats.totalContacts).toBe(0);
        expect(stats.totalSent).toBe(0);
        expect(stats.sentToday).toBe(0);
        expect(stats.successRate).toBe(0);
    });

    it("computes stats from seeded contacts", async () => {
        seedLocalData();
        const stats = await getStats();
        expect(stats.totalContacts).toBe(SEED_RECIPIENTS.length);
        expect(stats.totalSent).toBe(0);
    });

    it("getLogs returns an empty array when nothing was sent", async () => {
        const logs = await getLogs();
        expect(logs).toEqual([]);
    });

    it("clears local data", async () => {
        seedLocalData();
        expect(await getRecipients()).toHaveLength(SEED_RECIPIENTS.length);
        clearLocalData();
        expect(await getRecipients()).toHaveLength(0);
    });

    it("round-trips a pending selection (read once, then cleared)", () => {
        const selection = [
            { name: "Jean Dupont", phone: "+237691234567" },
            { name: "Amina Bello", phone: "+237678555102" },
        ];
        setPendingSelection(selection);

        expect(takePendingSelection()).toEqual(selection);
        // second read returns an empty array (already consumed)
        expect(takePendingSelection()).toEqual([]);
    });

    it("overwrites a previous pending selection", () => {
        setPendingSelection([{ name: "Old", phone: "+237691111111" }]);
        setPendingSelection([{ name: "New", phone: "+237692222222" }]);

        expect(takePendingSelection()).toEqual([{ name: "New", phone: "+237692222222" }]);
    });

    it("deletes several recipients at once and keeps the others", async () => {
        const a = await addRecipient("A", "691111111");
        const b = await addRecipient("B", "692222222");
        const c = await addRecipient("C", "693333333");

        await deleteRecipients([a.id, b.id]);

        const remaining = await getRecipients();
        expect(remaining.some((r) => r.id === a.id)).toBe(false);
        expect(remaining.some((r) => r.id === b.id)).toBe(false);
        expect(remaining.some((r) => r.id === c.id)).toBe(true);
    });

    it("ignores an empty deletion batch", async () => {
        seedLocalData();
        await deleteRecipients([]);
        expect(await getRecipients()).toHaveLength(SEED_RECIPIENTS.length);
    });

    it("defaults the local password to the demo value", () => {
        expect(getLocalPassword()).toBe("password");
        expect(checkLocalPassword("password")).toBe(true);
        expect(checkLocalPassword("nope")).toBe(false);
    });

    it("changes and verifies the local password", () => {
        setLocalPassword("nouveau-mdp");
        expect(getLocalPassword()).toBe("nouveau-mdp");
        expect(checkLocalPassword("password")).toBe(false);
        expect(checkLocalPassword("nouveau-mdp")).toBe(true);
    });
});
