import { mgpApi } from "@/core/api/mgpApi";
import { throwApiError } from "@/core/api/api-error";
import { Category } from "../interfaces/category.interface";

export const getCategoriesByUser = async () => {
  try {
    const { data } = await mgpApi.get<Category[]>(
      "/categories/categoriesByUser",
    );

    return data;
  } catch (error) {
    throwApiError(error, "Error al cargar las categorias");
  }
};
