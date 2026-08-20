import { Colors, type ThemeColors } from "@/constants/theme";
import { useColorScheme } from "./use-color-scheme";

/**
 * Paleta completa del esquema activo. Es la forma por defecto de leer colores
 * en un componente; `useThemeColor` queda solo para los primitivos Themed*
 * que aceptan override `light`/`dark` por props.
 *
 * El objeto devuelto es referencialmente estable (Colors.light/Colors.dark son
 * constantes de modulo), asi que sirve como dependencia de useCallback/useMemo
 * y como prop de componentes memoizados sin invalidarlos en cada render.
 */
export function useThemeColors(): ThemeColors {
  return useColorScheme() === "dark" ? Colors.dark : Colors.light;
}
