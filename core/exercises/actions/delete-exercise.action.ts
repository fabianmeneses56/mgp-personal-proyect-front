import { mgpApi } from "@/core/api/mgpApi";
import { isAxiosError } from "axios";

export const deleteExercise = async (exerciseId: string) => {
  try {
    await mgpApi.delete(`/exercises/${exerciseId}`);
  } catch (error) {
    if (isAxiosError(error)) {
      const responseMessage =
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : undefined;

      throw new Error(responseMessage || "Error al eliminar el ejercicio");
    }

    throw new Error("Error al eliminar el ejercicio");
  }
};
