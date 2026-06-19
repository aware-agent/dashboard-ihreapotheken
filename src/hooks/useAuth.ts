import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import type { ApiError } from '@/types/api';
import type {
  ChallengeRequest,
  ChallengeResponse,
  IntrospectRequest,
  IntrospectResponse,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  TokenResponse,
  VerifyOtpRequest,
} from '@/types/auth';

// Hook for sending OTP challenge
export function useChallenge() {
  return useMutation<ChallengeResponse, ApiError, ChallengeRequest>({
    mutationFn: authApi.challenge,
  });
}

// Hook for login with v1 endpoint
export function useLogin() {
  return useMutation<TokenResponse, ApiError, LoginRequest>({
    mutationFn: authApi.login,
  });
}

// Hook for verify OTP with v2 endpoint
export function useVerifyOtp() {
  return useMutation<TokenResponse, ApiError, VerifyOtpRequest>({
    mutationFn: authApi.verifyOtp,
  });
}

// Hook for refreshing token
export function useRefreshToken() {
  return useMutation<TokenResponse, ApiError, RefreshTokenRequest>({
    mutationFn: authApi.refreshToken,
  });
}

// Hook for logout
export function useLogout() {
  return useMutation<void, ApiError, LogoutRequest>({
    mutationFn: authApi.logout,
  });
}

// Hook for token introspection
export function useIntrospect() {
  return useMutation<IntrospectResponse, ApiError, IntrospectRequest>({
    mutationFn: authApi.introspect,
  });
}
