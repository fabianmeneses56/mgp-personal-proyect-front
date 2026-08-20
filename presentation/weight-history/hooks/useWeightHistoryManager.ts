import {
  createWeightHistory,
  CreateWeightHistoryPayload,
} from "@/core/weight-history/actions/create-weight-history.action";
import { deleteWeightHistory } from "@/core/weight-history/actions/delete-weight-history.action";
import { getWeightHistory } from "@/core/weight-history/actions/get-weight-history.action";
import { updateWeightHistory } from "@/core/weight-history/actions/update-weight-history.action";
import {
  toDisplayWeight,
  toKg,
  toTimestamp,
  WeightHistoryApiEntry,
  WeightHistoryEntry,
} from "@/core/weight-history/interfaces/weight-history.interface";
import { showAlert } from "@/helpers/alerts/alert.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { sortStrategies, WeightHistorySortKey } from "../utils/sort-strategies";

// Defined at module level on purpose: React Query only reuses the cached select
// result if the function keeps its identity across renders.
const selectWeightHistory = (
  entries: WeightHistoryApiEntry[],
): WeightHistoryEntry[] =>
  entries.map<WeightHistoryEntry>((entry) => ({
    id: entry.id,
    weight: toDisplayWeight(entry.weightGrams, entry.weightUnit),
    weightUnit: entry.weightUnit,
    weightKg: toKg(entry.weightGrams),
    note: entry.note ?? undefined,
    date: entry.date,
    timestamp: toTimestamp(entry.date),
  }));

// Same reason: an inline `= []` would create a new array on every render while
// the query is loading or failed, invalidating the useMemo hooks that depend on it.
const EMPTY_HISTORY: WeightHistoryEntry[] = [];

export const useWeightHistoryManager = (
  exerciseId: string,
  sortKey: WeightHistorySortKey = "dateDesc",
) => {
  const queryClient = useQueryClient();

  const {
    data: mappedHistory = EMPTY_HISTORY,
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["weight-history", exerciseId],
    queryFn: () => getWeightHistory(exerciseId),
    select: selectWeightHistory,
  });

  const weightHistory = useMemo(
    () => [...mappedHistory].sort(sortStrategies[sortKey]),
    [mappedHistory, sortKey],
  );

  const latestWeightEntry = useMemo(
    () =>
      mappedHistory.reduce<WeightHistoryEntry | null>(
        (latest, entry) =>
          !latest || entry.timestamp > latest.timestamp ? entry : latest,
        null,
      ),
    [mappedHistory],
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["weight-history", exerciseId] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateWeightHistoryPayload) =>
      createWeightHistory(exerciseId, payload),
    onSuccess: invalidate,
    onError: (error: Error) => showAlert("Error", error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      entryId,
      payload,
    }: {
      entryId: string;
      payload: CreateWeightHistoryPayload;
    }) => updateWeightHistory(exerciseId, entryId, payload),
    onSuccess: invalidate,
    onError: (error: Error) => showAlert("Error", error.message),
  });

  const removeMutation = useMutation({
    mutationFn: ({ entryId }: { entryId: string }) =>
      deleteWeightHistory(exerciseId, entryId),
    onSuccess: invalidate,
    onError: (error: Error) => showAlert("Error", error.message),
  });

  // Fire-and-forget like removeEntry: each mutation's onError is the only place
  // that reports a failure, so callers just declare success through options.
  const saveEntry = (
    payload: CreateWeightHistoryPayload,
    entryId?: string,
    options?: { onSuccess?: () => void },
  ) =>
    entryId
      ? updateMutation.mutate({ entryId, payload }, options)
      : createMutation.mutate(payload, options);

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
