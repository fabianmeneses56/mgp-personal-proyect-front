import { updateCreateCategory } from "@/core/categories/actions/create-update-category.action";
import { mgpApi } from "@/core/api/mgpApi";
import { buildCategory } from "@/test-utils/fixtures";

jest.mock("@/core/api/mgpApi", () => ({
  mgpApi: {
    post: jest.fn(),
  },
}));

const mockedMgpApi = mgpApi as jest.Mocked<typeof mgpApi>;

describe("updateCreateCategory", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates a category when the id is 'new'", async () => {
    const category = buildCategory({ id: "new", name: "Legs" });
    mockedMgpApi.post.mockResolvedValue({ data: category });

    const result = await updateCreateCategory(category);

    expect(mockedMgpApi.post).toHaveBeenCalledWith("/categories", {
      name: "Legs",
    });
    expect(result).toEqual(category);
  });

  it("creates a category when there is no id", async () => {
    const category = { name: "Pull", exercise: [] };
    mockedMgpApi.post.mockResolvedValue({ data: buildCategory(category) });

    await updateCreateCategory(category);

    expect(mockedMgpApi.post).toHaveBeenCalledWith("/categories", {
      name: "Pull",
    });
  });

  it("documents current behavior: an id other than 'new' still creates instead of updating", async () => {
    const category = buildCategory({ id: "existing-id", name: "Legs" });
    mockedMgpApi.post.mockResolvedValue({ data: category });

    await updateCreateCategory(category);

    expect(mockedMgpApi.post).toHaveBeenCalledWith("/categories", {
      name: "Legs",
    });
  });

  it("throws when the request fails", async () => {
    mockedMgpApi.post.mockRejectedValue(new Error("Network error"));

    await expect(
      updateCreateCategory(buildCategory({ id: "new" })),
    ).rejects.toThrow("Error al guardar la categoria");
  });
});
