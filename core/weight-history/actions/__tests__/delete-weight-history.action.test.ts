import { deleteWeightHistory } from "@/core/weight-history/actions/delete-weight-history.action";
import { mgpApi } from "@/core/api/mgpApi";

jest.mock("@/core/api/mgpApi", () => ({
  mgpApi: {
    delete: jest.fn(),
  },
}));

const mockedMgpApi = mgpApi as jest.Mocked<typeof mgpApi>;

describe("deleteWeightHistory", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls DELETE /exercises/:id/weight-history/:entryId", async () => {
    mockedMgpApi.delete.mockResolvedValue({});

    await deleteWeightHistory("exercise-1", "entry-1");

    expect(mockedMgpApi.delete).toHaveBeenCalledWith(
      "/exercises/exercise-1/weight-history/entry-1",
    );
  });

  it("propagates the response message from an axios error", async () => {
    mockedMgpApi.delete.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Entry not found" } },
    });

    await expect(
      deleteWeightHistory("exercise-1", "entry-1"),
    ).rejects.toThrow("Entry not found");
  });

  it("falls back to a generic message when the error has no response message", async () => {
    mockedMgpApi.delete.mockRejectedValue(new Error("Network error"));

    await expect(
      deleteWeightHistory("exercise-1", "entry-1"),
    ).rejects.toThrow("Error al eliminar el registro de peso");
  });
});
