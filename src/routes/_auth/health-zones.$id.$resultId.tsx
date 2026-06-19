import { createFileRoute } from "@tanstack/react-router";
import HealthZoneDetail from "@/features/health-zone-detail";

export const Route = createFileRoute("/_auth/health-zones/$id/$resultId")({
  component: HealthZoneDetail,
});
