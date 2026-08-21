import { mgpApi } from "@/core/api/mgpApi";
import { throwApiError } from "@/core/api/api-error";

export const deleteWeightHistory = async (
  exerciseId: string,
  entryId: string,
): Promise<void> => {
  try {
    await mgpApi.delete(`/exercises/${exerciseId}/weight-history/${entryId}`);
  } catch (error) {
    throwApiError(error, "Error al eliminar el registro de peso");
  }
};
