import { updateCreateCategory } from "@/core/categories/actions/create-update-category.action";
import { showAlert } from "@/helpers/alerts/alert.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
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
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });

      showAlert("Categoria guardada", `${data.name} se guardo correctamente`);
    },
  });

  return { productMutation };
};
