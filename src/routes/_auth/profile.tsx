import { createFileRoute, redirect } from "@tanstack/react-router";
import Profile from "@/features/profile";
import { AUTH_COOKIE_KEYS } from "@/lib/cookies";

export const Route = createFileRoute("/_auth/profile")({
  beforeLoad: async ({ context }) => {
    const { cookies } = context;
    const refreshToken = cookies.get(AUTH_COOKIE_KEYS.REFRESH_TOKEN);
    if (!refreshToken && !import.meta.env.VITE_LOCAL) {
      return redirect({ to: "/login" });
    }
  },
  component: Profile,
});
