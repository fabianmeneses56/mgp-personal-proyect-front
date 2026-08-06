import { getWeightHistory } from "@/core/weight-history/actions/get-weight-history.action";
import { mgpApi } from "@/core/api/mgpApi";
import { buildWeightHistoryApiEntries } from "@/test-utils/fixtures";

jest.mock("@/core/api/mgpApi", () => ({
  mgpApi: {
    get: jest.fn(),
  },
}));

const mockedMgpApi = mgpApi as jest.Mocked<typeof mgpApi>;

describe("getWeightHistory", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("requests /exercises/:id/weight-history and returns the entries", async () => {
    const entries = buildWeightHistoryApiEntries();
    mockedMgpApi.get.mockResolvedValue({ data: entries });

    const result = await getWeightHistory("exercise-1");

    expect(mockedMgpApi.get).toHaveBeenCalledWith(
      "/exercises/exercise-1/weight-history",
    );
    expect(result).toEqual(entries);
  });

  it("propagates the response message from an axios error", async () => {
    mockedMgpApi.get.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Exercise not found" } },
    });

    await expect(getWeightHistory("exercise-1")).rejects.toThrow(
      "Exercise not found",
    );
  });

  it("falls back to a generic message when the error has no response message", async () => {
    mockedMgpApi.get.mockRejectedValue(new Error("Network error"));

    await expect(getWeightHistory("exercise-1")).rejects.toThrow(
      "Error al obtener el historial de pesos",
    );
  });
});
