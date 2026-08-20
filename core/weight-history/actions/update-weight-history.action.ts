import { mgpApi } from "@/core/api/mgpApi";
import { throwApiError } from "@/core/api/api-error";
import { WeightHistoryApiEntry } from "@/core/weight-history/interfaces/weight-history.interface";

export interface UpdateWeightHistoryPayload {
  weight: number;
  weightUnit: string;
  note?: string;
  date: string;
}

export const updateWeightHistory = async (
  exerciseId: string,
  entryId: string,
  payload: UpdateWeightHistoryPayload,
): Promise<WeightHistoryApiEntry> => {
  try {
    const { data } = await mgpApi.patch<WeightHistoryApiEntry>(
      `/exercises/${exerciseId}/weight-history/${entryId}`,
      payload,
    );
    return data;
  } catch (error) {
    throwApiError(error, "Error al actualizar el peso");
  }
};
