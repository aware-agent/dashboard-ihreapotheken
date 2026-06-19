import { useQuery } from "@tanstack/react-query";
import { appointmentsApi } from "@/api/appointments";
import type { ApiError } from "@/types/api";
import type { AppointmentsResponse } from "@/types/appointments";
import { useCookies } from "./useCookies";

export const appointmentsKeys = {
  all: ["appointments"] as const,
  list: () => [...appointmentsKeys.all, "list"] as const,
};

export function useAppointments() {
  const { isAuthenticated } = useCookies();

  return useQuery<AppointmentsResponse, ApiError>({
    queryKey: appointmentsKeys.list(),
    queryFn: appointmentsApi.getAll,
    enabled: isAuthenticated() || import.meta.env.VITE_LOCAL === 'true',
  });
}
