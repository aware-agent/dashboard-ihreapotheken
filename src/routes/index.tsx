import { createFileRoute, redirect } from "@tanstack/react-router";
import Index from "@/features/index";
import { AUTH_COOKIE_KEYS } from "@/lib/cookies";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const { cookies } = context;
    const refreshToken = cookies.get(AUTH_COOKIE_KEYS.REFRESH_TOKEN);
    if (refreshToken || import.meta.env.VITE_LOCAL) {
      return redirect({ to: "/dashboard" });
    }
  },
  component: Index,
});
