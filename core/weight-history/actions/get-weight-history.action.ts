import { mgpApi } from "@/core/api/mgpApi";
import { WeightHistoryApiEntry } from "@/core/weight-history/interfaces/weight-history.interface";
import { isAxiosError } from "axios";

export const getWeightHistory = async (
  exerciseId: string
): Promise<WeightHistoryApiEntry[]> => {
  try {
    const { data } = await mgpApi.get<WeightHistoryApiEntry[]>(
      `/exercises/${exerciseId}/weight-history`
    );
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      const responseMessage =
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : undefined;

      throw new Error(responseMessage || "Error al obtener el historial de pesos");
    }

    throw new Error("Error al obtener el historial de pesos");
  }
};
