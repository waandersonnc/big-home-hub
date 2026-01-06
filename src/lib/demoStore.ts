// Simple memory store for demo mode
// Now persists to sessionStorage so it survives page refreshes
// but clears when the browser tab is closed

const DEMO_STORAGE_KEY = 'bighome_demo_active';

// Initialize from sessionStorage
let isDemoActive = typeof window !== 'undefined'
    ? sessionStorage.getItem(DEMO_STORAGE_KEY) === 'true'
    : false;

export const demoStore = {
    get isActive() {
        // Re-check sessionStorage in case it changed
        if (typeof window !== 'undefined') {
            isDemoActive = sessionStorage.getItem(DEMO_STORAGE_KEY) === 'true';
        }
        return isDemoActive;
    },
    activate() {
        isDemoActive = true;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(DEMO_STORAGE_KEY, 'true');
        }
    },
    deactivate() {
        isDemoActive = false;
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(DEMO_STORAGE_KEY);
        }
    }
};
