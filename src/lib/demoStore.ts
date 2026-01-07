// Simple memory store for demo mode
// Now persists to sessionStorage so it survives page refreshes
// but clears when the browser tab is closed

const DEMO_STORAGE_KEY = 'bighome_demo_active';

// Initialize from sessionStorage
let isDemoActive = typeof window !== 'undefined'
    ? sessionStorage.getItem(DEMO_STORAGE_KEY) === 'true'
    : false;

type Listener = (active: boolean) => void;
const listeners = new Set<Listener>();

const notify = () => {
    listeners.forEach(l => l(isDemoActive));
};

export const demoStore = {
    get isActive() {
        // Re-check sessionStorage in case it changed (e.g. other tab)
        if (typeof window !== 'undefined') {
            const current = sessionStorage.getItem(DEMO_STORAGE_KEY) === 'true';
            if (current !== isDemoActive) {
                isDemoActive = current;
                // No notify here to avoid infinite loops if called during render
            }
        }
        return isDemoActive;
    },
    activate() {
        if (isDemoActive) return;
        isDemoActive = true;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(DEMO_STORAGE_KEY, 'true');
        }
        notify();
    },
    deactivate() {
        if (!isDemoActive) return;
        isDemoActive = false;
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(DEMO_STORAGE_KEY);
        }
        notify();
    },
    subscribe(listener: Listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
};
