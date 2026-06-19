import { env } from "@/config/urls";
import Cookies, { type CookieSetOptions } from "universal-cookie";

export const AUTH_COOKIE_KEYS = {
  ACCESS_TOKEN: `aware-at-${env.VITE_LETTERS_CODE}`,
  REFRESH_TOKEN: `aware-rt-${env.VITE_LETTERS_CODE}`,
  TEMP_ACCESS_TOKEN: `aware-temp-at-${env.VITE_LETTERS_CODE}`,
  EXPIRES_AT: `aware-expires-at-${env.VITE_LETTERS_CODE}`,
} as const;

export type AuthCookieKey = (typeof AUTH_COOKIE_KEYS)[keyof typeof AUTH_COOKIE_KEYS];

type AuthTokensPayload = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

const defaultCookieOptions: CookieSetOptions = {
  path: "/",
  sameSite: "lax",
  secure: Boolean(env.VITE_NODE_ENV === "prod"),
  domain: Boolean(env.VITE_NODE_ENV === "dev") ? undefined : ".aware.app",
};

class CookieManager {
  private readonly cookies = new Cookies();

  set(name: AuthCookieKey, value: string, options: CookieSetOptions = {}) {
    this.cookies.set(name, value, {
      ...defaultCookieOptions,
      ...options,
    });
  }

  get(name: AuthCookieKey): string | undefined {
    return this.cookies.get(name);
  }

  remove(name: AuthCookieKey, options: CookieSetOptions = {}) {
    this.cookies.remove(name, {
      ...defaultCookieOptions,
      ...options,
    });
  }

  setAuthTokens({ accessToken, refreshToken, expiresAt }: AuthTokensPayload) {
    const expires = new Date(expiresAt);

    this.set(AUTH_COOKIE_KEYS.ACCESS_TOKEN, accessToken, { expires });
    this.set(AUTH_COOKIE_KEYS.REFRESH_TOKEN, refreshToken, { expires });
    this.set(AUTH_COOKIE_KEYS.EXPIRES_AT, expiresAt.toString(), { expires });
  }

  getAuthTokens() {
    const accessToken = this.get(AUTH_COOKIE_KEYS.ACCESS_TOKEN) ?? null;
    const refreshToken = this.get(AUTH_COOKIE_KEYS.REFRESH_TOKEN) ?? null;
    const expiresAtValue = this.get(AUTH_COOKIE_KEYS.EXPIRES_AT);
    const expiresAt = expiresAtValue ? Number(expiresAtValue) : null;

    return {
      accessToken,
      refreshToken,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
    };
  }

  clearAuthTokens() {
    this.remove(AUTH_COOKIE_KEYS.ACCESS_TOKEN);
    this.remove(AUTH_COOKIE_KEYS.REFRESH_TOKEN);
    this.remove(AUTH_COOKIE_KEYS.EXPIRES_AT);
    this.remove(AUTH_COOKIE_KEYS.TEMP_ACCESS_TOKEN);
  }


  isAuthenticated() {
    const authCookies = this.getAuthTokens();
    return authCookies.refreshToken ? true : false;
  }

}

export const cookieManager = new CookieManager();

export type AppCookieManager = CookieManager;
