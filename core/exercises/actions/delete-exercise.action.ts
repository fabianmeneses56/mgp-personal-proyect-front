import { mgpApi } from "@/core/api/mgpApi";
import { throwApiError } from "@/core/api/api-error";

export const deleteExercise = async (exerciseId: string) => {
  try {
    await mgpApi.delete(`/exercises/${exerciseId}`);
  } catch (error) {
    throwApiError(error, "Error al eliminar el ejercicio");
  }
};
