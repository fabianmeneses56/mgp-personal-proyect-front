import { deleteExercise } from "@/core/exercises/actions/delete-exercise.action";
import { showAlert } from "@/helpers/alerts/alert.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  const deleteExerciseMutation = useMutation({
    mutationFn: deleteExercise,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError(error) {
      showAlert("Error", error.message);
    },
  });

  return {
    remove: deleteExerciseMutation.mutate,
    isDeleting: deleteExerciseMutation.isPending,
  };
};
