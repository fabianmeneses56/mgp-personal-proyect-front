import { mgpApi } from "@/core/api/mgpApi";
import { Exercise } from "@/core/categories/interfaces/category.interface";
import { PickedExerciseImage } from "@/core/exercises/interfaces/picked-exercise-image.interface";
import { isAxiosError } from "axios";

export interface CreateExercisePayload {
  name: string;
  weight: number;
  weightUnit: string;
  category: string;
  image?: PickedExerciseImage;
}

export const createExercise = async (exercise: CreateExercisePayload) => {
  try {
    const formData = new FormData();
    formData.append("name", exercise.name);
    formData.append("weight", String(exercise.weight));
    formData.append("weightUnit", exercise.weightUnit);
    formData.append("category", exercise.category);

    if (exercise.image) {
      formData.append("image", {
        uri: exercise.image.uri,
        name: exercise.image.fileName,
        type: exercise.image.mimeType,
      } as unknown as Blob);
    }

    const { data } = await mgpApi.post<Exercise>("/exercises", formData);
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      const responseMessage =
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : undefined;

      throw new Error(responseMessage || "Error al crear el ejercicio");
    }

    throw new Error("Error al crear el ejercicio");
  }
};
