import { createWeightHistory, CreateWeightHistoryPayload } from "@/core/weight-history/actions/create-weight-history.action";
import { deleteWeightHistory } from "@/core/weight-history/actions/delete-weight-history.action";
import { getWeightHistory } from "@/core/weight-history/actions/get-weight-history.action";
import { updateWeightHistory, UpdateWeightHistoryPayload } from "@/core/weight-history/actions/update-weight-history.action";
import { toDisplayWeight, WeightHistoryEntry } from "@/core/weight-history/interfaces/weight-history.interface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

export const useWeightHistory = (exerciseId: string) => {
  const queryClient = useQueryClient();

  const { data: weightHistory = [], isLoading } = useQuery({
    queryKey: ["weight-history", exerciseId],
    queryFn: () => getWeightHistory(exerciseId),
    select: (entries) =>
      entries.map<WeightHistoryEntry>((entry) => ({
        id: entry.id,
        weight: toDisplayWeight(entry.weightGrams, entry.weightUnit),
        weightUnit: entry.weightUnit,
        note: entry.note ?? undefined,
        date: entry.date,
      })),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["weight-history", exerciseId] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateWeightHistoryPayload) =>
      createWeightHistory(exerciseId, payload),
    onSuccess: invalidate,
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ entryId, payload }: { entryId: string; payload: UpdateWeightHistoryPayload }) =>
      updateWeightHistory(exerciseId, entryId, payload),
    onSuccess: invalidate,
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const removeMutation = useMutation({
    mutationFn: ({ entryId }: { entryId: string }) =>
      deleteWeightHistory(exerciseId, entryId),
    onSuccess: invalidate,
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  return { weightHistory, isLoading, createMutation, updateMutation, removeMutation };
};
