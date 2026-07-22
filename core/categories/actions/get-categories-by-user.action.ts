import { mgpApi } from "@/core/api/mgpApi";
import { Category } from "../interfaces/category.interface";

export const getCategoriesByUser = async () => {
  try {
    const { data } = await mgpApi.get<Category[]>(
      "/categories/categoriesByUser"
    );

    return data;
  } catch (error) {
    throw new Error("Unable to load categories");
  }
};
