import { createFileRoute } from "@tanstack/react-router";
import BiomarkerDetail from "@/features/biomarker-detail";

export const Route = createFileRoute("/_auth/biomarkers/$id")({
  component: BiomarkerDetail,
});
