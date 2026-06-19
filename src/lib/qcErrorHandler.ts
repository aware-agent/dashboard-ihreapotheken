import { Mutation, Query, QueryKey } from "@tanstack/react-query";
import { AUTH_COOKIE_KEYS, cookieManager } from "@/lib/cookies";
import { env } from "@/config/urls";
import { redirect } from "@tanstack/react-router";

const REFRESH_URL = `${env.VITE_API_BASE_URL}/v1/auth/refresh-token`;

export let isRefreshing = false;

let failedQueue: {
    query?: Query<unknown, unknown, unknown, QueryKey>;
    mutation?: Mutation<unknown, unknown, unknown, unknown>;
    variables?: unknown;
}[] = [];

const processFailedQueue = () => {
    failedQueue.forEach(({ query, mutation, variables }) => {
        if (query) {
            query.fetch();
        }
        if (mutation) {
            mutation.execute(variables);
        }
    });
    isRefreshing = false;
    failedQueue = [];
};

const refreshTokenAndRetry = async (
    query?: Query<unknown, unknown, unknown, QueryKey>,
    mutation?: Mutation<unknown, unknown, unknown, unknown>,
    variables?: unknown
) => {
    try {
        if (!isRefreshing) {
            isRefreshing = true;
            failedQueue.push({ query, mutation, variables });
            const { refreshToken } = cookieManager.getAuthTokens();
            if (!refreshToken) {
                redirect({ to: "/login" });
                return;
            }
            const response = await fetch(REFRESH_URL, {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error("Something went wrong while refreshing your access token");
            }
            const { access_token } = await response.json();
            cookieManager.set(AUTH_COOKIE_KEYS.ACCESS_TOKEN, access_token);
            processFailedQueue();
        } else {
            failedQueue.push({ query, mutation, variables });
        }
    } catch {
        cookieManager.clearAuthTokens();
    }
};

const errorHandler = (
    error: unknown,
    query?: Query<unknown, unknown, unknown, QueryKey>,
    mutation?: Mutation<unknown, unknown, unknown, unknown>,
    variables?: unknown
) => {
    const { statusCode } = (error as unknown as { statusCode: number });

    if (statusCode === 401) {
        console.log('401 error, refreshing token');
        if (query) refreshTokenAndRetry(query);
        if (mutation) refreshTokenAndRetry(undefined, mutation, variables);
    }
};

export const queryErrorHandler = (
    error: unknown,
    query: Query<unknown, unknown, unknown, QueryKey>
) => {
    errorHandler(error, query);
};

export const mutationErrorHandler = (
    error: unknown,
    variables: unknown,
    _context: unknown,
    mutation: Mutation<unknown, unknown, unknown, unknown>
) => {
    errorHandler(error, undefined, mutation, variables);
};