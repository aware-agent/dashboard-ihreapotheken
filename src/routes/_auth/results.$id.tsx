import { createFileRoute } from "@tanstack/react-router";
import ResultDetail from "@/features/result-detail";

export const Route = createFileRoute("/_auth/results/$id")({
  component: ResultDetail,
});
