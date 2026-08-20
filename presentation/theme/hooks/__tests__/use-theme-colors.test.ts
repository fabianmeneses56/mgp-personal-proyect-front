import { renderHook } from "@testing-library/react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/presentation/theme/hooks/use-color-scheme";
import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";

jest.mock("@/presentation/theme/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}));

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>;

afterEach(() => {
  jest.clearAllMocks();
});

describe("useThemeColors", () => {
  it("returns the dark palette when the scheme is dark", async () => {
    mockedUseColorScheme.mockReturnValue("dark");

    const { result } = await renderHook(() => useThemeColors());

    expect(result.current).toBe(Colors.dark);
  });

  it("returns the light palette when the scheme is light", async () => {
    mockedUseColorScheme.mockReturnValue("light");

    const { result } = await renderHook(() => useThemeColors());

    expect(result.current).toBe(Colors.light);
  });

  // RN reporta "unspecified" cuando el sistema no expone una preferencia.
  it("falls back to the light palette when the scheme is unspecified", async () => {
    mockedUseColorScheme.mockReturnValue("unspecified");

    const { result } = await renderHook(() => useThemeColors());

    expect(result.current).toBe(Colors.light);
  });

  // Devolver la constante tal cual (y no un objeto nuevo) es lo que permite
  // usar `colors` como dependencia de useMemo/useCallback sin invalidarlas.
  it("keeps the same reference across re-renders", async () => {
    mockedUseColorScheme.mockReturnValue("light");

    const { result, rerender } = await renderHook(() => useThemeColors());
    const first = result.current;
    await rerender({});

    expect(result.current).toBe(first);
  });
});
