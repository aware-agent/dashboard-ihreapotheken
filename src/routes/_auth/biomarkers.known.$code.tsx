import { createFileRoute, redirect } from "@tanstack/react-router";
import { AUTH_COOKIE_KEYS } from "@/lib/cookies";
import BiomarkerDetail from "@/features/biomarker-detail";

// Route for known biomarkers by code: /biomarkers/known/:code
export const Route = createFileRoute("/_auth/biomarkers/known/$code")({
  beforeLoad: async ({ context }) => {
    const { cookies } = context;
    const refreshToken = cookies.get(AUTH_COOKIE_KEYS.REFRESH_TOKEN);
    if (!refreshToken && !import.meta.env.VITE_LOCAL) {
      return redirect({ to: "/login" });
    }
  },
  component: BiomarkerDetail,
});
