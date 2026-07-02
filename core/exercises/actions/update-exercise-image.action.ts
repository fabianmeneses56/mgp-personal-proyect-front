import { mgpApi } from "@/core/api/mgpApi";
import { Exercise } from "@/core/categories/interfaces/category.interface";
import { PickedExerciseImage } from "@/core/exercises/interfaces/picked-exercise-image.interface";
import { isAxiosError } from "axios";

export const updateExerciseImage = async (
  exerciseId: string,
  image: PickedExerciseImage
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
      formData
    );
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      const responseMessage =
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : undefined;

      throw new Error(responseMessage || "Error al actualizar la imagen del ejercicio");
    }

    throw new Error("Error al actualizar la imagen del ejercicio");
  }
};
