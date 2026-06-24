import { getCategoriesByUser } from "@/core/categories/actions/get-categories-by-user.action";
import { useQuery } from "@tanstack/react-query";

export const useCategories = () => {
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategoriesByUser,
  });

  return { categoriesQuery };
};
