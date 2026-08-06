import { createExercise } from "@/core/exercises/actions/create-exercise.action";
import { mgpApi } from "@/core/api/mgpApi";

jest.mock("@/core/api/mgpApi", () => ({
  mgpApi: {
    post: jest.fn(),
  },
}));

const mockedMgpApi = mgpApi as jest.Mocked<typeof mgpApi>;

describe("createExercise", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("posts a FormData with name, weight, weightUnit and category", async () => {
    mockedMgpApi.post.mockResolvedValue({ data: {} });

    await createExercise({
      name: "Bench Press",
      weight: 80,
      weightUnit: "kg",
      category: "category-1",
    });

    expect(mockedMgpApi.post).toHaveBeenCalledWith(
      "/exercises",
      expect.any(FormData),
    );
    const formData = mockedMgpApi.post.mock.calls[0][1] as FormData;
    expect(formData.get("name")).toBe("Bench Press");
    expect(formData.get("weight")).toBe("80");
    expect(formData.get("weightUnit")).toBe("kg");
    expect(formData.get("category")).toBe("category-1");
    expect(formData.get("image")).toBeNull();
  });

  it("attaches the image only when it is included in the payload", async () => {
    mockedMgpApi.post.mockResolvedValue({ data: {} });

    await createExercise({
      name: "Squat",
      weight: 100,
      weightUnit: "kg",
      category: "category-1",
      image: {
        uri: "file:///photo.jpg",
        fileName: "photo.jpg",
        mimeType: "image/jpeg",
      },
    });

    const formData = mockedMgpApi.post.mock.calls[0][1] as FormData;
    expect(formData.get("image")).not.toBeNull();
  });

  it("propagates the response message from an axios error", async () => {
    mockedMgpApi.post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Invalid weight" } },
    });

    await expect(
      createExercise({
        name: "Squat",
        weight: -1,
        weightUnit: "kg",
        category: "category-1",
      }),
    ).rejects.toThrow("Invalid weight");
  });

  it("falls back to a generic message when the error has no response message", async () => {
    mockedMgpApi.post.mockRejectedValue(new Error("Network error"));

    await expect(
      createExercise({
        name: "Squat",
        weight: 100,
        weightUnit: "kg",
        category: "category-1",
      }),
    ).rejects.toThrow("Error al crear el ejercicio");
  });
});
