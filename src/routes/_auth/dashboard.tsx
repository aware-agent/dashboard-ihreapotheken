import Dashboard from "@/features/dashboard";
import { AUTH_COOKIE_KEYS } from "@/lib/cookies";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/dashboard")({
  beforeLoad: async ({ context }) => {
    const { cookies } = context;
    const refreshToken = cookies.get(AUTH_COOKIE_KEYS.REFRESH_TOKEN);
    if (!refreshToken && !import.meta.env.VITE_LOCAL) {
      return redirect({ to: "/login" });
    }
  },
  component: Dashboard,
});
