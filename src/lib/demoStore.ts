// Simple memory store for demo mode
// This state is intentionally not persisted to localStorage/sessionStorage
// so that a page refresh clears the session

let isDemoActive = false;

export const demoStore = {
    get isActive() {
        return isDemoActive;
    },
    activate() {
        isDemoActive = true;
    },
    deactivate() {
        isDemoActive = false;
    }
};
