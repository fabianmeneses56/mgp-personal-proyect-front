import { createWeightHistory, CreateWeightHistoryPayload } from "@/core/weight-history/actions/create-weight-history.action";
import { deleteWeightHistory } from "@/core/weight-history/actions/delete-weight-history.action";
import { getWeightHistory } from "@/core/weight-history/actions/get-weight-history.action";
import { updateWeightHistory } from "@/core/weight-history/actions/update-weight-history.action";
import { toDisplayWeight, toKg, WeightHistoryApiEntry, WeightHistoryEntry } from "@/core/weight-history/interfaces/weight-history.interface";
import { showAlert } from "@/helpers/alerts/alert.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Definido a nivel de modulo a proposito: React Query solo reusa el resultado
// cacheado del select si la funcion mantiene su identidad entre renders.
const selectWeightHistory = (entries: WeightHistoryApiEntry[]) =>
  entries
    .map<WeightHistoryEntry>((entry) => ({
      id: entry.id,
      weight: toDisplayWeight(entry.weightGrams, entry.weightUnit),
      weightUnit: entry.weightUnit,
      weightKg: toKg(entry.weightGrams),
      note: entry.note ?? undefined,
      date: entry.date,
    }))
    // mas reciente primero: es el orden en el que se muestra el historial
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const useWeightHistoryManager = (exerciseId: string) => {
  const queryClient = useQueryClient();

  const { data: weightHistory = [], isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: ["weight-history", exerciseId],
    queryFn: () => getWeightHistory(exerciseId),
    select: selectWeightHistory,
  });

  const latestWeightEntry = weightHistory[0] ?? null;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["weight-history", exerciseId] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateWeightHistoryPayload) =>
      createWeightHistory(exerciseId, payload),
    onSuccess: invalidate,
    onError: (error: Error) => showAlert("Error", error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ entryId, payload }: { entryId: string; payload: CreateWeightHistoryPayload }) =>
      updateWeightHistory(exerciseId, entryId, payload),
    onSuccess: invalidate,
    onError: (error: Error) => showAlert("Error", error.message),
  });

  const removeMutation = useMutation({
    mutationFn: ({ entryId }: { entryId: string }) =>
      deleteWeightHistory(exerciseId, entryId),
    onSuccess: invalidate,
    onError: (error: Error) => showAlert("Error", error.message),
  });

  const saveEntry = (payload: CreateWeightHistoryPayload, entryId?: string) =>
    entryId
      ? updateMutation.mutateAsync({ entryId, payload })
      : createMutation.mutateAsync(payload);

  const removeEntry = (entryId: string) => removeMutation.mutate({ entryId });

  return {
    weightHistory,
    latestWeightEntry,
    isLoading,
    isRefetching,
    isError,
    refetch,
    saveEntry,
    isSaving: createMutation.isPending || updateMutation.isPending,
    removeEntry,
  };
};
