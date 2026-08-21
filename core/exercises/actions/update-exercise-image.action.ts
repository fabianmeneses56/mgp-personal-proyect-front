import { mgpApi } from "@/core/api/mgpApi";
import { throwApiError } from "@/core/api/api-error";
import { Exercise } from "@/core/categories/interfaces/category.interface";
import { PickedExerciseImage } from "@/core/exercises/interfaces/picked-exercise-image.interface";

export const updateExerciseImage = async (
  exerciseId: string,
  image: PickedExerciseImage,
) => {
  try {
    const formData = new FormData();
    formData.append("image", {
      uri: image.uri,
      name: image.fileName,
      type: image.mimeType,
    } as unknown as Blob);

    const { data } = await mgpApi.patch<Exercise>(
      `/exercises/${exerciseId}`,
      formData,
    );
    return data;
  } catch (error) {
    throwApiError(error, "Error al actualizar la imagen del ejercicio");
  }
};
