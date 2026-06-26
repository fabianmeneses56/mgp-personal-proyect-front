import { mgpApi } from "@/core/api/mgpApi";
import { isAxiosError } from "axios";

export const deleteWeightHistory = async (
  exerciseId: string,
  entryId: string
): Promise<void> => {
  try {
    await mgpApi.delete(`/exercises/${exerciseId}/weight-history/${entryId}`);
  } catch (error) {
    if (isAxiosError(error)) {
      const responseMessage =
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : undefined;

      throw new Error(responseMessage || "Error al eliminar el registro de peso");
    }

    throw new Error("Error al eliminar el registro de peso");
  }
};
