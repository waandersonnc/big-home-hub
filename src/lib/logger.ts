/**
 * Logger utilitário que só loga em desenvolvimento
 * Remove logs sensíveis em produção
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Sanitiza dados sensíveis antes de logar
 */
function sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveKeys = ['password', 'token', 'email', 'phone', 'cpf', 'cnpj'];
    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            sanitized[key] = '[REDACTED]';
        }
    }

    return sanitized;
}

export const logger = {
    log: (...args: any[]) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    info: (...args: any[]) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },

    warn: (...args: any[]) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },

    error: (...args: any[]) => {
        // Errors sempre logam, mas sanitizados
        const sanitizedArgs = args.map(arg =>
            typeof arg === 'object' ? sanitizeData(arg) : arg
        );
        console.error(...sanitizedArgs);
    },

    debug: (message: string, data?: any) => {
        if (isDevelopment) {
            console.log(`[DEBUG] ${message}`, data ? sanitizeData(data) : '');
        }
    },
};
