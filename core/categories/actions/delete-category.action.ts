import { mgpApi } from "@/core/api/mgpApi";
import { isAxiosError } from "axios";

export const deleteCategory = async (categoryId: string) => {
  try {
    await mgpApi.delete(`/categories/${categoryId}`);
  } catch (error) {
    if (isAxiosError(error)) {
      const responseMessage =
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : undefined;

      throw new Error(responseMessage || "Error al eliminar la categoria");
    }

    throw new Error("Error al eliminar la categoria");
  }
};
