import { updateCreateCategory } from "@/core/categories/actions/create-update-category.action";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { Alert } from "react-native";
import { Category } from "../../../core/categories/interfaces/category.interface";

export function withExecutionLogging<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  label: string,
) {
  return async (...args: Args): Promise<Result> => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      console.log(
        `[${label}] ejecutado en ${(performance.now() - start).toFixed(2)}ms`,
      );
      return result;
    } catch (error) {
      console.log(
        `[${label}] fallo tras ${(performance.now() - start).toFixed(2)}ms`,
      );
      throw error;
    }
  };
}
const loggedUpdateCreateCategory = withExecutionLogging(
  updateCreateCategory,
  "updateCreateCategory",
);
export const useCategory = (categoryId: string) => {
  const queryClient = useQueryClient();
  const productIdRef = useRef(categoryId);

  const productMutation = useMutation({
    mutationFn: async (data: Category) =>
      loggedUpdateCreateCategory({
        ...data,
        id: productIdRef.current,
      }),

    onSuccess(data: Category) {
      productIdRef.current = data.id;
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });

      Alert.alert("Categoria guardada", `${data.name} se guardo correctamente`);
    },
  });

  return { productMutation };
};
