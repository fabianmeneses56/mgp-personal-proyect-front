import { mgpApi } from "@/core/api/mgpApi";
import { throwApiError } from "@/core/api/api-error";
import { WeightHistoryApiEntry } from "@/core/weight-history/interfaces/weight-history.interface";

export interface CreateWeightHistoryPayload {
  weight: number;
  weightUnit: string;
  note?: string;
  date: string;
}

export const createWeightHistory = async (
  exerciseId: string,
  payload: CreateWeightHistoryPayload,
): Promise<WeightHistoryApiEntry> => {
  try {
    const { data } = await mgpApi.post<WeightHistoryApiEntry>(
      `/exercises/${exerciseId}/weight-history`,
      payload,
    );
    return data;
  } catch (error) {
    throwApiError(error, "Error al registrar el peso");
  }
};
