import { mgpApi } from "@/core/api/mgpApi";
import { throwApiError } from "@/core/api/api-error";

export const deleteCategory = async (categoryId: string) => {
  try {
    await mgpApi.delete(`/categories/${categoryId}`);
  } catch (error) {
    throwApiError(error, "Error al eliminar la categoria");
  }
};
