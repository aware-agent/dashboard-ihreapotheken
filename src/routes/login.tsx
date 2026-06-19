import { createFileRoute, redirect } from "@tanstack/react-router";

import { AUTH_COOKIE_KEYS } from "@/lib/cookies";
import Auth from "@/features/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    const { cookies } = context;
    const refreshToken = cookies.get(AUTH_COOKIE_KEYS.REFRESH_TOKEN);
    if (refreshToken || import.meta.env.VITE_LOCAL) {
      return redirect({ to: "/dashboard" });
    }
  },
  component: Auth,
});
