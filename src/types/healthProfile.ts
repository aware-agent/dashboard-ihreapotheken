// API response for health profile questions (from BFF)
export interface HealthProfileQuestionsApiResponse {
  healthProfile: HealthProfileCategory[];
  updatedAt?: string;
}

// API response for user health profile answers
export interface UserHealthProfileApiResponse {
  healthProfile: HealthProfileAnswer[];
  updatedAt?: string;
}

// Category returned from BFF
export interface HealthProfileCategory {
  code: string; // 'personal' | 'nutrition' | 'lifestyle' | 'medical'
  title: string;
  icon?: string;
  questions: HealthProfileQuestion[];
}

// Question with possible answers
export interface HealthProfileQuestion {
  code: string; // e.g., 'weight', 'height', 'diabetes'
  title: string;
  description?: string;
  type: 'SELECTION_SINGLE' | 'SELECTION_MULTIPLE' | 'NUMBER_DECIMAL' | 'NUMBER_INTEGER' | 'TEXT';
  currentValue?: string | number | boolean | null;
  input?: HealthProfileInput;
}

export interface HealthProfileInput {
  options?: HealthProfileOption[];
  unit?: string; // for numeric inputs like 'kg', 'cm'
  min?: number;
  max?: number;
  hint?: number;
}

export interface HealthProfileOption {
  value: string | number | boolean | null;
  label: string;
}

// User's answer for a single question
export interface HealthProfileAnswer {
  code: string;
  value: string | number | boolean | null;
}

// User's complete health profile
export interface UserHealthProfile {
  healthProfile: HealthProfileAnswer[];
}

// API responses
export type HealthProfileQuestionsResponse = HealthProfileCategory[];
export type UserHealthProfileResponse = UserHealthProfile;

// Category styling configuration
export interface CategoryStyle {
  iconColor: string;
  bgColor: string;
  icon: string;
}

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  personal: {
    iconColor: '#8E8AF2',
    bgColor: '#EDE8FD',
    icon: 'User',
  },
  nutrition: {
    iconColor: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'Utensils',
  },
  lifestyle: {
    iconColor: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'Activity',
  },
  medical: {
    iconColor: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: 'Heart',
  },
};
