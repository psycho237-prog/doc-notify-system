/**
 * Vitest setup.
 *
 * The data layer detects "local" mode when no real Firebase API key is
 * present, and reads/writes localStorage. Node has neither, so we stub
 * localStorage with an in-memory implementation and force local mode.
 */

class MemoryStorage implements Storage {
    private store = new Map<string, string>();

    get length(): number {
        return this.store.size;
    }

    clear(): void {
        this.store.clear();
    }

    getItem(key: string): string | null {
        return this.store.has(key) ? (this.store.get(key) as string) : null;
    }

    key(index: number): string | null {
        return Array.from(this.store.keys())[index] ?? null;
    }

    removeItem(key: string): void {
        this.store.delete(key);
    }

    setItem(key: string, value: string): void {
        this.store.set(key, String(value));
    }
}

if (typeof globalThis.localStorage === "undefined") {
    Object.defineProperty(globalThis, "localStorage", {
        value: new MemoryStorage(),
        writable: true,
        configurable: true,
    });
}

// Always run data-layer tests in local (demo) mode.
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSyDUMMY-SAFE-FOR-BUILD";
