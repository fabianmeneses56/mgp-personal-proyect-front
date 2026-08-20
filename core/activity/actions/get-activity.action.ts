import { mgpApi } from "@/core/api/mgpApi";
import { throwApiError } from "@/core/api/api-error";
import { ActivityItem } from "@/core/activity/interfaces/activity.interface";

export const getActivity = async (limit = 20): Promise<ActivityItem[]> => {
  try {
    const { data } = await mgpApi.get<ActivityItem[]>("/activity", {
      params: { limit },
    });
    return data;
  } catch (error) {
    throwApiError(error, "Error al obtener la actividad reciente");
  }
};
