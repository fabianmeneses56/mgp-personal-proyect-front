import { mgpApi } from "@/core/api/mgpApi";
import { throwApiError } from "@/core/api/api-error";
import { Exercise } from "@/core/categories/interfaces/category.interface";
import { PickedExerciseImage } from "@/core/exercises/interfaces/picked-exercise-image.interface";

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
    throwApiError(error, "Error al crear el ejercicio");
  }
};
