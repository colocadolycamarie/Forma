import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LinkCoachInput, LinkedCoach, RosterAthlete } from "@forma/shared";
import { api } from "@/lib/api-client";

const CODE_KEY = ["coach", "code"] as const;
const ROSTER_KEY = ["coach", "roster"] as const;
const MY_COACHES_KEY = ["coach", "mine"] as const;

export function useCoachCode() {
  return useQuery<{ code: string }>({
    queryKey: CODE_KEY,
    queryFn: () => api.get<{ code: string }>("/coach/code"),
  });
}

export function useRoster() {
  return useQuery<RosterAthlete[]>({
    queryKey: ROSTER_KEY,
    queryFn: () => api.get<RosterAthlete[]>("/coach/roster"),
  });
}

export function useMyCoaches() {
  return useQuery<LinkedCoach[]>({
    queryKey: MY_COACHES_KEY,
    queryFn: () => api.get<LinkedCoach[]>("/coach/mine"),
  });
}

export function useLinkCoach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LinkCoachInput) => api.post<LinkedCoach>("/coach/link", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_COACHES_KEY }),
  });
}

export function useRemoveLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => api.delete<void>(`/coach/links/${linkId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROSTER_KEY });
      queryClient.invalidateQueries({ queryKey: MY_COACHES_KEY });
    },
  });
}
