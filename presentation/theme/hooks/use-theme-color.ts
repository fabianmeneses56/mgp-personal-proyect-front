/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type ThemeColorName } from "@/constants/theme";
import { useColorScheme } from "./use-color-scheme";

/**
 * Lee un unico token permitiendo sobrescribirlo por props (`light`/`dark`).
 * Ese override es su unica razon de ser: para leer colores sin override usa
 * `useThemeColors()`, que devuelve la paleta entera en una sola llamada.
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColorName
) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
