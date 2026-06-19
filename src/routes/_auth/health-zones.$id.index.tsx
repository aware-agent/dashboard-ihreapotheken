import HealthZoneDetail from "@/features/health-zone-detail";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/health-zones/$id/")({
  component: HealthZoneDetail,
});
