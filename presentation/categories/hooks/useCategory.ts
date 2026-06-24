import { updateCreateCategory } from "@/core/categories/actions/create-update-category.action";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { Alert } from "react-native";
import { Category } from "../../../core/categories/interfaces/category.interface";

export const useCategory = (categoryId: string) => {
  const queryClient = useQueryClient();
  const productIdRef = useRef(categoryId);

  const productMutation = useMutation({
    mutationFn: async (data: Category) =>
      updateCreateCategory({
        ...data,
        id: productIdRef.current,
      }),

    onSuccess(data: Category) {
      productIdRef.current = data.id;
      console.log("response", data);
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });

      Alert.alert("Categoria guardada", `${data.name} se guardo correctamente`);
    },
  });

  return { productMutation };
};
