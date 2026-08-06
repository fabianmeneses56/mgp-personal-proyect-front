import { createWeightHistory } from "@/core/weight-history/actions/create-weight-history.action";
import { mgpApi } from "@/core/api/mgpApi";

jest.mock("@/core/api/mgpApi", () => ({
  mgpApi: {
    post: jest.fn(),
  },
}));

const mockedMgpApi = mgpApi as jest.Mocked<typeof mgpApi>;

describe("createWeightHistory", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("posts the payload to /exercises/:id/weight-history", async () => {
    const payload = {
      weight: 80,
      weightUnit: "kg",
      date: "2024-01-01T00:00:00.000Z",
    };
    mockedMgpApi.post.mockResolvedValue({ data: { id: "entry-1" } });

    const result = await createWeightHistory("exercise-1", payload);

    expect(mockedMgpApi.post).toHaveBeenCalledWith(
      "/exercises/exercise-1/weight-history",
      payload,
    );
    expect(result).toEqual({ id: "entry-1" });
  });

  it("propagates the response message from an axios error", async () => {
    mockedMgpApi.post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Invalid weight" } },
    });

    await expect(
      createWeightHistory("exercise-1", {
        weight: -1,
        weightUnit: "kg",
        date: "2024-01-01T00:00:00.000Z",
      }),
    ).rejects.toThrow("Invalid weight");
  });

  it("falls back to a generic message when the error has no response message", async () => {
    mockedMgpApi.post.mockRejectedValue(new Error("Network error"));

    await expect(
      createWeightHistory("exercise-1", {
        weight: 80,
        weightUnit: "kg",
        date: "2024-01-01T00:00:00.000Z",
      }),
    ).rejects.toThrow("Error al registrar el peso");
  });
});
