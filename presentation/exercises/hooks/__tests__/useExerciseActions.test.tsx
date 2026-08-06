import { QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";

import { deleteExercise } from "@/core/exercises/actions/delete-exercise.action";
import { useExerciseActions } from "@/presentation/exercises/hooks/useExerciseActions";
import { usePickExerciseImage } from "@/presentation/exercises/hooks/usePickExerciseImage";
import { createQueryWrapper } from "@/test-utils/query-wrapper";

jest.mock("expo-image", () => ({
  Image: { prefetch: jest.fn() },
}));
jest.mock("@/core/exercises/actions/delete-exercise.action");
jest.mock("@/presentation/exercises/hooks/usePickExerciseImage");

const mockedDeleteExercise = deleteExercise as jest.MockedFunction<
  typeof deleteExercise
>;
const mockedUsePickExerciseImage =
  usePickExerciseImage as jest.MockedFunction<typeof usePickExerciseImage>;
const mockedAlert = Alert.alert as jest.Mock;
const mockedRouterBack = router.back as jest.Mock;

const mockPickImage = jest.fn();

beforeEach(() => {
  mockedUsePickExerciseImage.mockReturnValue({ pickImage: mockPickImage });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("useExerciseActions.remove", () => {
  it("invalidates the categories query, navigates back and alerts on success", async () => {
    mockedDeleteExercise.mockResolvedValue();
    const invalidateSpy = jest.spyOn(
      QueryClient.prototype,
      "invalidateQueries",
    );

    const { result } = await renderHook(
      () => useExerciseActions("exercise-1", "Bench Press"),
      { wrapper: createQueryWrapper() },
    );

    await act(async () => {
      result.current.remove();
      await waitFor(() => expect(mockedAlert).toHaveBeenCalled());
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["categories"] });
    expect(mockedRouterBack).toHaveBeenCalled();
    expect(mockedAlert).toHaveBeenCalledWith(
      "Ejercicio eliminado",
      "Bench Press se eliminó correctamente",
    );

    invalidateSpy.mockRestore();
  });

  it("alerts with the error message when the mutation fails", async () => {
    mockedDeleteExercise.mockRejectedValue(
      new Error("Error al eliminar el ejercicio"),
    );

    const { result } = await renderHook(
      () => useExerciseActions("exercise-1", "Bench Press"),
      { wrapper: createQueryWrapper() },
    );

    await act(async () => {
      result.current.remove();
      await waitFor(() =>
        expect(mockedAlert).toHaveBeenCalledWith(
          "Error",
          "Error al eliminar el ejercicio",
        ),
      );
    });

    expect(mockedRouterBack).not.toHaveBeenCalled();
  });
});

describe("useExerciseActions.changeImage", () => {
  it("does not mutate when the picker returns no image", async () => {
    mockPickImage.mockResolvedValue(null);

    const { result } = await renderHook(
      () => useExerciseActions("exercise-1", "Bench Press"),
      { wrapper: createQueryWrapper() },
    );

    await act(async () => {
      await result.current.changeImage();
    });

    expect(result.current.isChangingImage).toBe(false);
    expect(result.current.currentImageUrl).toBeUndefined();
  });
});
