import { deleteExercise } from "@/core/exercises/actions/delete-exercise.action";
import { mgpApi } from "@/core/api/mgpApi";

jest.mock("@/core/api/mgpApi", () => ({
  mgpApi: {
    delete: jest.fn(),
  },
}));

const mockedMgpApi = mgpApi as jest.Mocked<typeof mgpApi>;

describe("deleteExercise", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls DELETE /exercises/:id", async () => {
    mockedMgpApi.delete.mockResolvedValue({});

    await deleteExercise("exercise-1");

    expect(mockedMgpApi.delete).toHaveBeenCalledWith("/exercises/exercise-1");
  });

  it("propagates the response message from an axios error", async () => {
    mockedMgpApi.delete.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Exercise has weight history" } },
    });

    await expect(deleteExercise("exercise-1")).rejects.toThrow(
      "Exercise has weight history",
    );
  });

  it("falls back to a generic message when the error has no response message", async () => {
    mockedMgpApi.delete.mockRejectedValue(new Error("Network error"));

    await expect(deleteExercise("exercise-1")).rejects.toThrow(
      "Error al eliminar el ejercicio",
    );
  });
});
