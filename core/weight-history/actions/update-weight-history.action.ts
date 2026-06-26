import { mgpApi } from "@/core/api/mgpApi";
import { WeightHistoryApiEntry } from "@/core/weight-history/interfaces/weight-history.interface";
import { isAxiosError } from "axios";

export interface UpdateWeightHistoryPayload {
  weight: number;
  weightUnit: string;
  note?: string;
  date: string;
}

export const updateWeightHistory = async (
  exerciseId: string,
  entryId: string,
  payload: UpdateWeightHistoryPayload
): Promise<WeightHistoryApiEntry> => {
  try {
    const { data } = await mgpApi.patch<WeightHistoryApiEntry>(
      `/exercises/${exerciseId}/weight-history/${entryId}`,
      payload
    );
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      const responseMessage =
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : undefined;

      throw new Error(responseMessage || "Error al actualizar el peso");
    }

    throw new Error("Error al actualizar el peso");
  }
};
