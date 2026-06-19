// Connection type for authentication
export type AuthConnection = 'email';

// Challenge request - sends OTP to user
export interface ChallengeRequest {
  username: string;
  connection: AuthConnection;
}

// Challenge response
export interface ChallengeResponse {
  success: boolean;
  message?: string;
}

// Login request (v1 endpoint)
export interface LoginRequest {
  username: string;
  otp: string;
}

// Verify OTP request (v2 endpoint)
export interface VerifyOtpRequest {
  username: string;
  otp: string;
}

// Token response - returned by login endpoints (matches API response exactly)
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  userExists: boolean;
}

// Refresh token request
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Logout request
export interface LogoutRequest {
  refreshToken: string;
}

// Introspect request
export interface IntrospectRequest {
  token: string;
}

// Introspect response
export interface IntrospectResponse {
  active: boolean;
  exp?: number;
  iat?: number;
  sub?: string;
}

// Auth state for context
export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isLoading: boolean;
}

// Auth context value type
export interface AuthContextValue extends AuthState {
  setTokens: (tokens: TokenResponse) => void;
  clearTokens: () => void;
  getAccessToken: () => string | null;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
}

// Login step for UI flow
export type LoginStep = 'email' | 'otp';

// Login form state
export interface LoginFormState {
  step: LoginStep;
  email: string;
}
