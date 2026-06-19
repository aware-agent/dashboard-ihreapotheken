import { apiClient } from './client';
import {
  ChallengeRequest,
  ChallengeResponse,
  LoginRequest,
  VerifyOtpRequest,
  TokenResponse,
  RefreshTokenRequest,
  LogoutRequest,
  IntrospectRequest,
  IntrospectResponse,
} from '@/types/auth';

// Auth API endpoints
export const authApi = {
  // Send OTP challenge to user's email
  challenge(data: ChallengeRequest): Promise<ChallengeResponse> {
    return apiClient.post<ChallengeResponse, ChallengeRequest>(
      '/v1/auth/challenge',
      data
    );
  },

  // Login with OTP (v1 endpoint)
  login(data: LoginRequest): Promise<TokenResponse> {
    return apiClient.post<TokenResponse, LoginRequest>(
      '/v1/auth/login',
      data
    );
  },

  // Verify OTP (v2 endpoint) - primary login method
  verifyOtp(data: VerifyOtpRequest): Promise<TokenResponse> {
    return apiClient.post<TokenResponse, VerifyOtpRequest>(
      '/v2/auth/login/verify-otp',
      data
    );
  },

  // Refresh access token
  refreshToken(data: RefreshTokenRequest): Promise<TokenResponse> {
    return apiClient.post<TokenResponse, RefreshTokenRequest>(
      '/v1/auth/refresh-token',
      data
    );
  },

  // Logout - invalidate refresh token
  logout(data: LogoutRequest): Promise<void> {
    return apiClient.post<void, LogoutRequest>(
      '/v1/auth/logout',
      data
    );
  },

  // Introspect token - check if token is valid
  introspect(data: IntrospectRequest): Promise<IntrospectResponse> {
    return apiClient.post<IntrospectResponse, IntrospectRequest>(
      '/v1/auth/introspect',
      data
    );
  },
};
