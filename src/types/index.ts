/**
 * Type definitions para o projeto BigHome Hub
 * Substitui o uso de 'any' por tipos específicos
 */

// ============================================
// AUTH & USER TYPES
// ============================================

export type UserType = 'owner' | 'manager' | 'broker';

export interface User {
    id: string;
    email: string;
    created_at?: string;
    user_metadata?: {
        full_name?: string;
        phone?: string;
    };
}

export interface AuthUser {
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    role: UserType;
    real_estate_company_id?: string;
    manager_id?: string; // For brokers - their manager
    validoutoken?: boolean; // For owners
    onboarding_completed?: boolean; // For owners
    avatar_url?: string;
    document?: string;
    settings?: any;
    my_owner?: string; // For managers and brokers
}

export interface OwnerData {
    full_name: string;
    phone: string;
    email: string;
}

export interface WebhookResponse {
    conta_criada: boolean;
    message?: string;
    error?: string;
}

// ============================================
// TEAM TYPES
// ============================================

export interface TeamMemberBase {
    id: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive';
    leads: number;
    sales: number;
}

export interface TeamMemberFromDB extends TeamMemberBase {
    full_name: string;
    user_type: UserType;
    avatar_url?: string | null;
    photo_url?: string | null;
    real_estate_company_id: string;
}

export interface TeamMemberDisplay extends TeamMemberBase {
    name: string;
    full_name: string;
    role: 'Gerente' | 'Corretor';
    avatar: string;
    user_type?: UserType;
    photo_url?: string | null;
}

// ============================================
// ONBOARDING TYPES
// ============================================

export interface OnboardingPersonalData {
    full_name: string;
    phone: string;
    cpf?: string;
}

export interface OnboardingQuantityData {
    num_brokers: number;
    num_properties: number;
}

export interface CompanyData {
    id?: string;
    name: string;
    document?: string; // Maps from 'cnpj'
    logo_url?: string; // Maps from 'company_logo_url'
    zip_code?: string; // Maps from 'address_zipcode'
    address?: string; // Maps from 'address_street'
    city?: string; // Maps from 'address_city'
    state?: string; // Maps from 'address_state'
    trading_name?: string; // Used for unit name
    email?: string;
    phone?: string;
}

export interface OnboardingCompanyData {
    companies: CompanyData[];
}

export interface OnboardingData {
    personal: OnboardingPersonalData;
    quantity: OnboardingQuantityData;
    companies: OnboardingCompanyData;
}

export interface OnboardingStepProps<T = any> {
    data: T;
    onUpdate: (val: T) => void;
    onNext: () => void;
    onBack?: () => void;
}

// ============================================
// SIGNUP TYPES
// ============================================

export interface SignupFormData {
    full_name: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

export interface SignupStepProps {
    formData: SignupFormData;
    onChange: (data: Partial<SignupFormData>) => void;
    onNext: () => void;
    onBack?: () => void;
}

// ============================================
// COMPANY TYPES
// ============================================

export interface Company {
    id: string;
    name: string;
    cnpj?: string;
    owner_id?: string;
    created_at?: string;
}

export interface CompanyWithRelations extends Company {
    real_estate_companies?: {
        name: string;
    };
}

// ============================================
// FORM VALIDATION TYPES
// ============================================

export interface ValidationError {
    field: string;
    message: string;
}

export interface FormState<T> {
    data: T;
    errors: ValidationError[];
    isSubmitting: boolean;
    isValid: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiError {
    message: string;
    code?: string;
    details?: any;
}

export interface ApiResponse<T = any> {
    data?: T;
    error?: ApiError;
    success: boolean;
}

// ============================================
// SUPABASE QUERY TYPES
// ============================================

export interface SupabaseUser {
    id: string;
    email: string;
    full_name?: string;
    user_type?: UserType;
    real_estate_company_id?: string;
    avatar_url?: string;
    phone?: string;
    created_at?: string;
}

export interface SupabaseOwner {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    token?: string;
    created_at?: string;
}
