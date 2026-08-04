import { deleteExercise } from "@/core/exercises/actions/delete-exercise.action";
import { updateExerciseImage } from "@/core/exercises/actions/update-exercise-image.action";
import { PickedExerciseImage } from "@/core/exercises/interfaces/picked-exercise-image.interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { usePickExerciseImage } from "./usePickExerciseImage";

export const useExerciseActions = (
  exerciseId: string,
  name?: string,
  imageUrl?: string,
) => {
  const queryClient = useQueryClient();
  const { pickImage } = usePickExerciseImage();
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(
    imageUrl || undefined,
  );

  const deleteMutation = useMutation({
    mutationFn: deleteExercise,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      router.back();
      Alert.alert(
        "Ejercicio eliminado",
        `${name ?? "El ejercicio"} se eliminó correctamente`,
      );
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  const imageMutation = useMutation({
    mutationFn: (image: PickedExerciseImage) =>
      updateExerciseImage(exerciseId, image),
    onSuccess(data) {
      if (data.imageUrl) Image.prefetch(data.imageUrl);
      setCurrentImageUrl(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  const changeImage = async () => {
    const image = await pickImage();
    if (image) imageMutation.mutate(image);
  };

  return {
    remove: () => deleteMutation.mutate(exerciseId),
    changeImage,
    currentImageUrl,
    isDeleting: deleteMutation.isPending,
    isChangingImage: imageMutation.isPending,
  };
};
