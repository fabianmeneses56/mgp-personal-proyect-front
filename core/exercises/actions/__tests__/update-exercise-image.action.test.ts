import { updateExerciseImage } from "@/core/exercises/actions/update-exercise-image.action";
import { mgpApi } from "@/core/api/mgpApi";

jest.mock("@/core/api/mgpApi", () => ({
  mgpApi: {
    patch: jest.fn(),
  },
}));

const mockedMgpApi = mgpApi as jest.Mocked<typeof mgpApi>;

describe("updateExerciseImage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("patches a FormData with the image", async () => {
    mockedMgpApi.patch.mockResolvedValue({ data: {} });

    await updateExerciseImage("exercise-1", {
      uri: "file:///photo.jpg",
      fileName: "photo.jpg",
      mimeType: "image/jpeg",
    });

    expect(mockedMgpApi.patch).toHaveBeenCalledWith(
      "/exercises/exercise-1",
      expect.any(FormData),
    );
    const formData = mockedMgpApi.patch.mock.calls[0][1] as FormData;
    expect(formData.get("image")).not.toBeNull();
  });

  it("propagates the response message from an axios error", async () => {
    mockedMgpApi.patch.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Invalid image" } },
    });

    await expect(
      updateExerciseImage("exercise-1", {
        uri: "file:///photo.jpg",
        fileName: "photo.jpg",
        mimeType: "image/jpeg",
      }),
    ).rejects.toThrow("Invalid image");
  });

  it("falls back to a generic message when the error has no response message", async () => {
    mockedMgpApi.patch.mockRejectedValue(new Error("Network error"));

    await expect(
      updateExerciseImage("exercise-1", {
        uri: "file:///photo.jpg",
        fileName: "photo.jpg",
        mimeType: "image/jpeg",
      }),
    ).rejects.toThrow("Error al actualizar la imagen del ejercicio");
  });
});
