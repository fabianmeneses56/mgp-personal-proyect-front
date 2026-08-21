import { getCategoriesByUser } from "@/core/categories/actions/get-categories-by-user.action";
import { mgpApi } from "@/core/api/mgpApi";
import { buildCategory } from "@/test-utils/fixtures";

jest.mock("@/core/api/mgpApi", () => ({
  mgpApi: {
    get: jest.fn(),
  },
}));

const mockedMgpApi = mgpApi as jest.Mocked<typeof mgpApi>;

describe("getCategoriesByUser", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("requests /categories/categoriesByUser and returns the categories", async () => {
    const categories = [buildCategory()];
    mockedMgpApi.get.mockResolvedValue({ data: categories });

    const result = await getCategoriesByUser();

    expect(mockedMgpApi.get).toHaveBeenCalledWith(
      "/categories/categoriesByUser",
    );
    expect(result).toEqual(categories);
  });

  it("propagates the response message from an axios error", async () => {
    mockedMgpApi.get.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Categories unavailable" } },
    });

    await expect(getCategoriesByUser()).rejects.toThrow(
      "Categories unavailable",
    );
  });

  it("falls back to a generic message when the error has no response message", async () => {
    mockedMgpApi.get.mockRejectedValue(new Error("Network error"));

    await expect(getCategoriesByUser()).rejects.toThrow(
      "Error al cargar las categorias",
    );
  });
});
