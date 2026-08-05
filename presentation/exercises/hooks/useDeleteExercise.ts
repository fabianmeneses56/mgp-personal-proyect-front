import { deleteExercise } from "@/core/exercises/actions/delete-exercise.action";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  const deleteExerciseMutation = useMutation({
    mutationFn: deleteExercise,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError(error) {
      Alert.alert("Error", error.message);
    },
  });

  return {
    remove: deleteExerciseMutation.mutate,
    isDeleting: deleteExerciseMutation.isPending,
  };
};
