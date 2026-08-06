import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { createWeightHistory } from "@/core/weight-history/actions/create-weight-history.action";
import { getWeightHistory } from "@/core/weight-history/actions/get-weight-history.action";
import { updateWeightHistory } from "@/core/weight-history/actions/update-weight-history.action";
import { useWeightHistoryManager } from "@/presentation/weight-history/hooks/useWeightHistoryManager";
import { buildWeightHistoryApiEntries } from "@/test-utils/fixtures";
import { createQueryWrapper } from "@/test-utils/query-wrapper";

jest.mock("@/core/weight-history/actions/get-weight-history.action");
jest.mock("@/core/weight-history/actions/create-weight-history.action");
jest.mock("@/core/weight-history/actions/update-weight-history.action");

const mockedGetWeightHistory = getWeightHistory as jest.MockedFunction<
  typeof getWeightHistory
>;
const mockedCreateWeightHistory = createWeightHistory as jest.MockedFunction<
  typeof createWeightHistory
>;
const mockedUpdateWeightHistory = updateWeightHistory as jest.MockedFunction<
  typeof updateWeightHistory
>;
const mockedAlert = Alert.alert as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

describe("useWeightHistoryManager", () => {
  it("normalizes entries to kg and orders them from most recent to oldest", async () => {
    mockedGetWeightHistory.mockResolvedValue(buildWeightHistoryApiEntries());

    const { result } = await renderHook(
      () => useWeightHistoryManager("exercise-1"),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.weightHistory.map((entry) => entry.id)).toEqual([
      "entry-3",
      "entry-2",
      "entry-1",
    ]);
    expect(result.current.weightHistory[0].weightKg).toBe(82);
    expect(result.current.weightHistory[1].weightKg).toBe(80);
    expect(result.current.weightHistory[2].weightKg).toBe(176.37);
  });

  it("exposes the most recent entry as latestWeightEntry", async () => {
    mockedGetWeightHistory.mockResolvedValue(buildWeightHistoryApiEntries());

    const { result } = await renderHook(
      () => useWeightHistoryManager("exercise-1"),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.latestWeightEntry?.id).toBe("entry-3");
  });

  it("calls createWeightHistory when saveEntry is called without an entryId", async () => {
    mockedGetWeightHistory.mockResolvedValue([]);
    mockedCreateWeightHistory.mockResolvedValue(
      buildWeightHistoryApiEntries()[0],
    );

    const { result } = await renderHook(
      () => useWeightHistoryManager("exercise-1"),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const payload = {
      weight: 80,
      weightUnit: "kg",
      date: "2024-01-01T00:00:00.000Z",
    };
    await act(async () => {
      await result.current.saveEntry(payload);
    });

    expect(mockedCreateWeightHistory).toHaveBeenCalledWith(
      "exercise-1",
      payload,
    );
    expect(mockedUpdateWeightHistory).not.toHaveBeenCalled();
  });

  it("calls updateWeightHistory when saveEntry is called with an entryId", async () => {
    mockedGetWeightHistory.mockResolvedValue([]);
    mockedUpdateWeightHistory.mockResolvedValue(
      buildWeightHistoryApiEntries()[0],
    );

    const { result } = await renderHook(
      () => useWeightHistoryManager("exercise-1"),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const payload = {
      weight: 80,
      weightUnit: "kg",
      date: "2024-01-01T00:00:00.000Z",
    };
    await act(async () => {
      await result.current.saveEntry(payload, "entry-1");
    });

    expect(mockedUpdateWeightHistory).toHaveBeenCalledWith(
      "exercise-1",
      "entry-1",
      payload,
    );
    expect(mockedCreateWeightHistory).not.toHaveBeenCalled();
  });

  it("alerts when a mutation fails", async () => {
    mockedGetWeightHistory.mockResolvedValue([]);
    mockedCreateWeightHistory.mockRejectedValue(
      new Error("Error al registrar el peso"),
    );

    const { result } = await renderHook(
      () => useWeightHistoryManager("exercise-1"),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(
        result.current.saveEntry({
          weight: 80,
          weightUnit: "kg",
          date: "2024-01-01T00:00:00.000Z",
        }),
      ).rejects.toThrow();
    });

    expect(mockedAlert).toHaveBeenCalledWith(
      "Error",
      "Error al registrar el peso",
    );
  });

  it("invalidates the weight-history query on a successful mutation", async () => {
    mockedGetWeightHistory.mockResolvedValue([]);
    mockedCreateWeightHistory.mockResolvedValue(
      buildWeightHistoryApiEntries()[0],
    );

    const { result } = await renderHook(
      () => useWeightHistoryManager("exercise-1"),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockedGetWeightHistory).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.saveEntry({
        weight: 80,
        weightUnit: "kg",
        date: "2024-01-01T00:00:00.000Z",
      });
    });

    await waitFor(() =>
      expect(mockedGetWeightHistory).toHaveBeenCalledTimes(2),
    );
  });
});
