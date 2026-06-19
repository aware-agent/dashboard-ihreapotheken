import { useCallback, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { AUTH_COOKIE_KEYS, type AuthCookieKey } from '@/lib/cookies';

export function useCookies() {
  const router = useRouter();
  const cookieManager = router.options.context.cookies;
  const [cookieVersion, setCookieVersion] = useState(0);

  const handleCookieChange = useCallback(() => {
    setCookieVersion((prevVersion) => prevVersion + 1);
  }, []);

  const getCookie = useCallback((name: AuthCookieKey) => {
    return cookieManager.get(name) ?? null;
  }, [cookieManager]);

  const setCookie = useCallback((name: AuthCookieKey, value: string) => {
    cookieManager.set(name, value);
    handleCookieChange();
  }, [cookieManager, handleCookieChange]);

  const removeCookie = useCallback((name: AuthCookieKey) => {
    cookieManager.remove(name);
    handleCookieChange();
  }, [cookieManager, handleCookieChange]);

  const clearAuthCookies = useCallback(() => {
    cookieManager.clearAuthTokens();
    handleCookieChange();
  }, [cookieManager, handleCookieChange]);

  //check if the auth cookies are set and not expired must return a boolean
  const isAuthenticated = useCallback(() => {
    return cookieManager.isAuthenticated();
  }, [cookieManager]);

  const authCookies = cookieManager.getAuthTokens();
  void cookieVersion;

  return {
    getCookie,
    setCookie,
    removeCookie,
    clearAuthCookies,
    authCookies,
    keys: AUTH_COOKIE_KEYS,
    isAuthenticated,
  };
}
