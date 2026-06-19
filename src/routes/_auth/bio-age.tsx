import { createFileRoute, redirect } from "@tanstack/react-router";
import BioAge from "@/features/bio-age";
import { AUTH_COOKIE_KEYS } from "@/lib/cookies";

export const Route = createFileRoute("/_auth/bio-age")({
  beforeLoad: async ({ context }) => {
    const { cookies } = context;
    const refreshToken = cookies.get(AUTH_COOKIE_KEYS.REFRESH_TOKEN);
    if (!refreshToken && !import.meta.env.VITE_LOCAL) {
      return redirect({ to: "/login" });
    }
  },
  component: BioAge,
});
