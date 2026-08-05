import { describe, it, expect, beforeEach } from "vitest";
import {
    addRecipient,
    checkLocalPassword,
    clearLocalData,
    createGroup,
    createUserAccount,
    deleteGroup,
    deleteRecipients,
    deleteUserAccount,
    getCleanupAfterSend,
    getGroups,
    getLocalPassword,
    getLogs,
    getMode,
    getPendingSends,
    getRecipients,
    getStats,
    getUsers,
    loginUser,
    queueSend,
    removeQueuedSend,
    removeSentFromDirectory,
    seedLocalData,
    setCleanupAfterSend,
    setLocalPassword,
    setLoggedOut,
    setPendingSelection,
    takePendingSelection,
    updateUserAccount,
} from "./data";
import { SEED_RECIPIENTS } from "./seed";
import { DEFAULT_ADMIN_EMAIL } from "./data";

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

describe("accounts (local mode)", () => {
    it("seeds the default super admin on first run", () => {
        const users = getUsers();
        expect(users).toHaveLength(1);
        expect(users[0].email).toBe(DEFAULT_ADMIN_EMAIL);
        expect(users[0].role).toBe("superadmin");
        // the password is never exposed
        expect(users[0].password).toBeUndefined();
    });

    it("logs in with the default admin credentials", () => {
        const user = loginUser(DEFAULT_ADMIN_EMAIL, "password");
        expect(user).not.toBeNull();
        expect(user?.role).toBe("superadmin");
    });

    it("rejects invalid credentials", () => {
        expect(loginUser(DEFAULT_ADMIN_EMAIL, "wrong")).toBeNull();
        expect(loginUser("nobody@nnlomne.gov", "password")).toBeNull();
    });

    it("creates a user account and rejects duplicate emails", async () => {
        const user = await createUserAccount({
            name: "Agent A",
            email: "agent@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        expect(user.id).toBeTruthy();
        expect(user.password).toBeUndefined();
        expect(getUsers()).toHaveLength(2);

        await expect(
            createUserAccount({
                name: "Agent B",
                email: "AGENT@nnlomne.gov",
                password: "secret123",
                role: "user",
            })
        ).rejects.toThrow("exists");
    });

    it("cannot delete the default super admin", async () => {
        await expect(deleteUserAccount("u-admin")).rejects.toThrow("cannot_delete_superadmin");
    });

    it("cannot lock the default super admin", async () => {
        await expect(updateUserAccount("u-admin", { disabled: true })).rejects.toThrow(
            "cannot_lock_superadmin"
        );
        // The admin still logs in.
        expect(loginUser(DEFAULT_ADMIN_EMAIL, "password")).not.toBeNull();
    });

    it("updates an account name, role and password", async () => {
        const user = await createUserAccount({
            name: "Agent A",
            email: "agent@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        const updated = await updateUserAccount(user.id, {
            name: "Agent Renommé",
            role: "superadmin",
            password: "newpass456",
        });
        expect(updated.name).toBe("Agent Renommé");
        expect(updated.role).toBe("superadmin");
        expect(updated.password).toBeUndefined();

        // Old password no longer works, the new one does.
        expect(loginUser(user.email, "secret123")).toBeNull();
        expect(loginUser(user.email, "newpass456")).not.toBeNull();
    });

    it("keeps the current password when none is provided", async () => {
        const user = await createUserAccount({
            name: "Agent A",
            email: "agent@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        await updateUserAccount(user.id, { name: "Agent A2" });
        expect(loginUser(user.email, "secret123")).not.toBeNull();
        const updated = getUsers().find((u) => u.id === user.id);
        expect(updated?.name).toBe("Agent A2");
    });

    it("rejects an invalid password reset", async () => {
        const user = await createUserAccount({
            name: "Agent A",
            email: "agent@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        await expect(updateUserAccount(user.id, { password: "123" })).rejects.toThrow("invalid");
    });

    it("changes an account email (login uses the new address)", async () => {
        const user = await createUserAccount({
            name: "Agent A",
            email: "agent@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        const updated = await updateUserAccount(user.id, { email: "nouveau@nnlomne.gov" });
        expect(updated.email).toBe("nouveau@nnlomne.gov");

        expect(loginUser("agent@nnlomne.gov", "secret123")).toBeNull();
        expect(loginUser("NOUVEAU@nnlomne.gov", "secret123")).not.toBeNull();
    });

    it("rejects a duplicate email (case-insensitive, excluding the edited account)", async () => {
        const a = await createUserAccount({
            name: "Agent A",
            email: "a@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        const b = await createUserAccount({
            name: "Agent B",
            email: "b@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        // Another account already owns this email.
        await expect(updateUserAccount(a.id, { email: "B@Nnlomne.gov" })).rejects.toThrow("exists");
        // Keeping your own email is allowed.
        await expect(updateUserAccount(a.id, { email: "A@NNLOMNE.GOV" })).resolves.toBeTruthy();
        await expect(updateUserAccount(b.id, { email: "a@nnlomne.gov" })).rejects.toThrow("exists");
    });

    it("rejects an invalid email format on update", async () => {
        const user = await createUserAccount({
            name: "Agent A",
            email: "agent@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        await expect(updateUserAccount(user.id, { email: "pas-un-email" })).rejects.toThrow("invalid_email");
    });

    it("locks an account and rejects its login", async () => {
        const user = await createUserAccount({
            name: "Agent A",
            email: "agent@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        // Valid credentials still work before the lock.
        expect(loginUser(user.email, "secret123")).not.toBeNull();

        const locked = await updateUserAccount(user.id, { disabled: true });
        expect(locked.disabled).toBe(true);
        expect(getUsers().find((u) => u.id === user.id)?.disabled).toBe(true);

        // Even with the correct password the account cannot sign in.
        expect(() => loginUser(user.email, "secret123")).toThrow("disabled");
        // Wrong password keeps the generic invalid response.
        expect(loginUser(user.email, "wrong")).toBeNull();
    });

    it("unlocks a locked account and restores login", async () => {
        const user = await createUserAccount({
            name: "Agent A",
            email: "agent@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        await updateUserAccount(user.id, { disabled: true });
        expect(() => loginUser(user.email, "secret123")).toThrow("disabled");

        const unlocked = await updateUserAccount(user.id, { disabled: false });
        expect(unlocked.disabled).toBe(false);
        expect(loginUser(user.email, "secret123")).not.toBeNull();
    });

    it("editing a locked account keeps the lock unless disabled is passed", async () => {
        const user = await createUserAccount({
            name: "Agent A",
            email: "agent@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        await updateUserAccount(user.id, { disabled: true });
        // A rename does not silently unlock the account.
        await updateUserAccount(user.id, { name: "Agent Renommé" });
        expect(getUsers().find((u) => u.id === user.id)?.disabled).toBe(true);
        expect(() => loginUser(user.email, "secret123")).toThrow("disabled");
    });

    it("deletes an account and its data", async () => {
        const user = await createUserAccount({
            name: "Agent A",
            email: "agent@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        expect(getUsers().some((u) => u.id === user.id)).toBe(true);
        await deleteUserAccount(user.id);
        expect(getUsers().some((u) => u.id === user.id)).toBe(false);
    });

    it("isolates data per account", async () => {
        const user = await createUserAccount({
            name: "Agent A",
            email: "agent@nnlomne.gov",
            password: "secret123",
            role: "user",
        });
        expect(loginUser(user.email, "secret123")).not.toBeNull();

        await addRecipient("Contact Agent", "691111111");
        const agentContacts = await getRecipients();
        expect(agentContacts.some((c) => c.name === "Contact Agent")).toBe(true);

        setLoggedOut();
        expect(loginUser(DEFAULT_ADMIN_EMAIL, "password")).not.toBeNull();
        const adminContacts = await getRecipients();
        expect(adminContacts.some((c) => c.name === "Contact Agent")).toBe(false);
    });
});

describe("notification groups (local mode)", () => {
    it("creates groups with a member snapshot", async () => {
        const group = await createGroup("Dossiers de 10h", [
            { id: "c1", name: "Jean Dupont", phone: "+237691234567" },
            { id: "c2", name: "Amina Bello", phone: "+237678555102" },
        ]);
        expect(group.id).toBeTruthy();
        expect(group.members).toHaveLength(2);

        const groups = await getGroups();
        expect(groups).toHaveLength(1);
        expect(groups[0].name).toBe("Dossiers de 10h");
    });

    it("deletes a group", async () => {
        const group = await createGroup("Test", [{ id: "c1", name: "X", phone: "+237691234567" }]);
        await deleteGroup(group.id);
        expect(await getGroups()).toHaveLength(0);
    });
});

describe("directory cleanup + offline queue (local mode)", () => {
    it("enables cleanup by default and toggles it", () => {
        expect(getCleanupAfterSend()).toBe(true);
        setCleanupAfterSend(false);
        expect(getCleanupAfterSend()).toBe(false);
        setCleanupAfterSend(true);
        expect(getCleanupAfterSend()).toBe(true);
    });

    it("removes sent phones from the directory", async () => {
        const a = await addRecipient("A", "691111111");
        await addRecipient("B", "692222222");
        const cleaned = await removeSentFromDirectory(["+237691111111"]);
        expect(cleaned).toBe(1);
        const remaining = await getRecipients();
        expect(remaining.some((r) => r.id === a.id)).toBe(false);
        expect(remaining).toHaveLength(1);
    });

    it("queues a send locally with queued log entries", async () => {
        const pending = queueSend({
            recipients: [{ name: "Jean", phone: "+237691234567" }],
            message: "Bonjour {name}",
            simulate: true,
        });
        expect(pending.id).toBeTruthy();
        expect(getPendingSends()).toHaveLength(1);

        const logs = await getLogs();
        expect(logs.some((l) => l.status === "queued" && l.pendingId === pending.id)).toBe(true);

        removeQueuedSend(pending.id);
        expect(getPendingSends()).toHaveLength(0);
    });
});

