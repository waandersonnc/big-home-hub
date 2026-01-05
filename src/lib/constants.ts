// System Constants
export const APP_NAME = 'BigHome Hub';
export const APP_VERSION = '1.0.0';

// Webhook URLs - Configuradas via variáveis de ambiente
export const WEBHOOK_URLS = {
    CREATE_OWNER_ACCOUNT: import.meta.env.VITE_WEBHOOK_CREATE_OWNER || 'https://n8n-n8n-start.zfverl.easypanel.host/webhook/criarcontaowner',
    RESEND_TOKEN: import.meta.env.VITE_WEBHOOK_RESEND_TOKEN || 'https://n8n-n8n-start.zfverl.easypanel.host/webhook/reenviartoken',
} as const;

// Webhook Response Keys
export const WEBHOOK_RESPONSE_KEYS = {
    ACCOUNT_CREATED: 'conta_criada',
} as const;

// Chart Configuration
export const CHART_CONFIG = {
    PERIOD_DAYS: {
        '30d': 30,
        '90d': 90,
        'total': 180,
    },
    DATA_POINTS: 8,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
    RESEND_CODE_COOLDOWN_MS: 60000, // 1 minuto
} as const;

// UI Text
export const UI_TEXT = {
    BUTTONS: {
        ADD_MEMBER: 'Adicionar Membro',
        CANCEL: 'Cancelar',
        SAVE: 'Salvar',
        SEND: 'Enviar',
        RESEND: 'Reenviar',
    },
    MESSAGES: {
        NO_MEMBERS_FOUND: 'Nenhum membro encontrado.',
        NO_LEADS_FOUND: 'Nenhuma oportunidade encontrada.',
        NO_SALES_REGISTERED: 'Nenhuma venda registrada.',
        NO_ACTIVITIES_SCHEDULED: 'Nenhuma atividade agendada.',
    },
} as const;

// User Types
export const USER_TYPES = {
    OWNER: 'owner',
    MANAGER: 'manager',
    BROKER: 'broker',
} as const;

export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];
