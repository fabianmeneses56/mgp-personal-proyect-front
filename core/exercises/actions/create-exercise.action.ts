import { mgpApi } from "@/core/api/mgpApi";
import { Exercise } from "@/core/categories/interfaces/category.interface";
import { isAxiosError } from "axios";

export interface CreateExercisePayload {
  name: string;
  weight: number;
  weightUnit: string;
  category: string;
}

export const createExercise = async (exercise: CreateExercisePayload) => {
  try {
    const { data } = await mgpApi.post<Exercise>("/exercises", exercise);
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      const responseMessage =
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : undefined;

      throw new Error(responseMessage || "Error al crear el ejercicio");
    }

    throw new Error("Error al crear el ejercicio");
  }
};
