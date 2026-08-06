import { QueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";

import { updateCreateCategory } from "@/core/categories/actions/create-update-category.action";
import { useCategory } from "@/presentation/categories/hooks/useCategory";
import { buildCategory } from "@/test-utils/fixtures";
import { createQueryWrapper } from "@/test-utils/query-wrapper";

jest.mock("@/core/categories/actions/create-update-category.action");

const mockedUpdateCreateCategory =
  updateCreateCategory as jest.MockedFunction<typeof updateCreateCategory>;
const mockedAlert = Alert.alert as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

describe("useCategory", () => {
  it("invalidates the categories query and shows a success alert on save", async () => {
    const savedCategory = buildCategory({ id: "category-1", name: "Legs" });
    mockedUpdateCreateCategory.mockResolvedValue(savedCategory);
    const invalidateSpy = jest.spyOn(
      QueryClient.prototype,
      "invalidateQueries",
    );

    const { result } = await renderHook(() => useCategory("new"), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.productMutation.mutateAsync(
        buildCategory({ name: "Legs" }),
      );
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["categories"] });
    expect(mockedAlert).toHaveBeenCalledWith(
      "Categoria guardada",
      "Legs se guardo correctamente",
    );

    invalidateSpy.mockRestore();
  });
});
