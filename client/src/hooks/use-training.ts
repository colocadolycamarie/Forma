import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AthleteHome, ExerciseHistory, LogSetInput, LoggedSet, WorkoutSessionDetail } from "@forma/shared";
import { api } from "@/lib/api-client";

const HOME_KEY = ["dashboard", "home"] as const;
const TODAY_SESSION_KEY = ["sessions", "today"] as const;
const historyKey = (exerciseId: string) => ["exercises", exerciseId, "history"] as const;

export function useAthleteHome(options?: { enabled?: boolean }) {
  return useQuery<AthleteHome>({
    queryKey: HOME_KEY,
    queryFn: () => api.get<AthleteHome>("/athlete/home"),
    enabled: options?.enabled ?? true,
  });
}

export function useTodaySession(options?: { enabled?: boolean }) {
  return useQuery<WorkoutSessionDetail>({
    queryKey: TODAY_SESSION_KEY,
    queryFn: () => api.get<WorkoutSessionDetail>("/sessions/today"),
    enabled: options?.enabled ?? true,
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api.post<WorkoutSessionDetail>(`/sessions/${sessionId}/start`),
    onSuccess: (session) => queryClient.setQueryData(TODAY_SESSION_KEY, session),
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api.post<WorkoutSessionDetail>(`/sessions/${sessionId}/complete`),
    onSuccess: (session) => {
      queryClient.setQueryData(TODAY_SESSION_KEY, session);
      queryClient.invalidateQueries({ queryKey: HOME_KEY });
    },
  });
}

export function useLogSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, input }: { sessionId: string; input: LogSetInput }) =>
      api.post<LoggedSet>(`/sessions/${sessionId}/sets`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODAY_SESSION_KEY });
      queryClient.invalidateQueries({ queryKey: HOME_KEY });
    },
  });
}

export function useExerciseHistory(exerciseId: string) {
  return useQuery<ExerciseHistory>({
    queryKey: historyKey(exerciseId),
    queryFn: () => api.get<ExerciseHistory>(`/exercises/${exerciseId}/history`),
    enabled: Boolean(exerciseId),
  });
}
