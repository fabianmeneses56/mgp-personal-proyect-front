import { deleteCategory } from "@/core/categories/actions/delete-category.action";
import { mgpApi } from "@/core/api/mgpApi";

jest.mock("@/core/api/mgpApi", () => ({
  mgpApi: {
    delete: jest.fn(),
  },
}));

const mockedMgpApi = mgpApi as jest.Mocked<typeof mgpApi>;

describe("deleteCategory", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls DELETE /categories/:id", async () => {
    mockedMgpApi.delete.mockResolvedValue({});

    await deleteCategory("category-1");

    expect(mockedMgpApi.delete).toHaveBeenCalledWith("/categories/category-1");
  });

  it("propagates the response message from an axios error", async () => {
    mockedMgpApi.delete.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Category has exercises" } },
    });

    await expect(deleteCategory("category-1")).rejects.toThrow(
      "Category has exercises",
    );
  });

  it("falls back to a generic message when the error has no response message", async () => {
    mockedMgpApi.delete.mockRejectedValue(new Error("Network error"));

    await expect(deleteCategory("category-1")).rejects.toThrow(
      "Error al eliminar la categoria",
    );
  });
});
