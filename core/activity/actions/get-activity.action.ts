import { mgpApi } from "@/core/api/mgpApi";
import { ActivityItem } from "@/core/activity/interfaces/activity.interface";
import { isAxiosError } from "axios";

export const getActivity = async (limit = 20): Promise<ActivityItem[]> => {
  try {
    const { data } = await mgpApi.get<ActivityItem[]>("/activity", {
      params: { limit },
    });
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      const responseMessage =
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : undefined;

      throw new Error(
        responseMessage || "Error al obtener la actividad reciente"
      );
    }

    throw new Error("Error al obtener la actividad reciente");
  }
};
