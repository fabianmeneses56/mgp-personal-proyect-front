import { mgpApi } from "@/core/api/mgpApi";
import { Category } from "../interfaces/category.interface";

interface response {
  name: string;
}

export const updateCreateCategory = (category: Partial<Category>) => {
  //   product.stock = isNaN(Number(product.stock)) ? 0 : Number(product.stock);
  //   product.price = isNaN(Number(product.price)) ? 0 : Number(product.price);

  if (category.id && category.id !== "new") {
    console.log("pending");
    // return updateProduct(product);
  }

  return createCategory(category);
};

async function createCategory(category: Partial<Category>) {
  const { id, exercise, ...rest } = category;

  try {
    const { data } = await mgpApi.post<Category>(`/categories`, {
      // todo: images
      ...rest,
    });

    return data;
  } catch (error) {
    throw new Error("Error al guardar la categoria");
  }
}
