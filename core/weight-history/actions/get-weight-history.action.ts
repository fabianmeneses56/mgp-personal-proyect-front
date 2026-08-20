import { mgpApi } from "@/core/api/mgpApi";
import { throwApiError } from "@/core/api/api-error";
import { WeightHistoryApiEntry } from "@/core/weight-history/interfaces/weight-history.interface";

export const getWeightHistory = async (
  exerciseId: string,
): Promise<WeightHistoryApiEntry[]> => {
  try {
    const { data } = await mgpApi.get<WeightHistoryApiEntry[]>(
      `/exercises/${exerciseId}/weight-history`,
    );
    return data;
  } catch (error) {
    throwApiError(error, "Error al obtener el historial de pesos");
  }
};
