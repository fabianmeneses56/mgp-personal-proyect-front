import { mgpApi } from "@/core/api/mgpApi";
import { WeightHistoryApiEntry } from "@/core/weight-history/interfaces/weight-history.interface";
import { isAxiosError } from "axios";

export interface CreateWeightHistoryPayload {
  weight: number;
  weightUnit: string;
  note?: string;
  date: string;
}

export const createWeightHistory = async (
  exerciseId: string,
  payload: CreateWeightHistoryPayload
): Promise<WeightHistoryApiEntry> => {
  try {
    const { data } = await mgpApi.post<WeightHistoryApiEntry>(
      `/exercises/${exerciseId}/weight-history`,
      payload
    );
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      const responseMessage =
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : undefined;

      throw new Error(responseMessage || "Error al registrar el peso");
    }

    throw new Error("Error al registrar el peso");
  }
};
