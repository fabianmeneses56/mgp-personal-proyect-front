import { updateWeightHistory } from "@/core/weight-history/actions/update-weight-history.action";
import { mgpApi } from "@/core/api/mgpApi";

jest.mock("@/core/api/mgpApi", () => ({
  mgpApi: {
    patch: jest.fn(),
  },
}));

const mockedMgpApi = mgpApi as jest.Mocked<typeof mgpApi>;

describe("updateWeightHistory", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("patches the payload to /exercises/:id/weight-history/:entryId", async () => {
    const payload = {
      weight: 82,
      weightUnit: "kg",
      date: "2024-02-01T00:00:00.000Z",
    };
    mockedMgpApi.patch.mockResolvedValue({ data: { id: "entry-1" } });

    const result = await updateWeightHistory(
      "exercise-1",
      "entry-1",
      payload,
    );

    expect(mockedMgpApi.patch).toHaveBeenCalledWith(
      "/exercises/exercise-1/weight-history/entry-1",
      payload,
    );
    expect(result).toEqual({ id: "entry-1" });
  });

  it("propagates the response message from an axios error", async () => {
    mockedMgpApi.patch.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Entry not found" } },
    });

    await expect(
      updateWeightHistory("exercise-1", "entry-1", {
        weight: 82,
        weightUnit: "kg",
        date: "2024-02-01T00:00:00.000Z",
      }),
    ).rejects.toThrow("Entry not found");
  });

  it("falls back to a generic message when the error has no response message", async () => {
    mockedMgpApi.patch.mockRejectedValue(new Error("Network error"));

    await expect(
      updateWeightHistory("exercise-1", "entry-1", {
        weight: 82,
        weightUnit: "kg",
        date: "2024-02-01T00:00:00.000Z",
      }),
    ).rejects.toThrow("Error al actualizar el peso");
  });
});
