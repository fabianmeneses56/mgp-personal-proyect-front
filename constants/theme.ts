/**
 * Design tokens for the "Gym Tracker Rediseño" visual language.
 * Colors are defined for light and dark mode.
 */

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#101116",
    textMuted: "#71757F",
    textFaint: "#9A9EA8",
    background: "#FFFFFF",
    surface: "#F5F6F8",
    surfaceBorder: "rgba(16,17,22,0.06)",
    surfaceBorderStrong: "rgba(16,17,22,0.10)",
    tint: "#4B5BF5",
    icon: "#71757F",
    tabIconDefault: "#71757F",
    tabIconSelected: "#4B5BF5",

    primary: "#4B5BF5",
    primarySoft: "#ECEEFE",
    danger: "#E5484D",
    dangerBg: "#FDECEC",
    dangerBorder: "#F8CBCC",
    sheetHandle: "#E1E2E6",
  },
  dark: {
    text: "#F4F5F7",
    textMuted: "#9A9EA8",
    textFaint: "#6A6E78",
    background: "#0B0C0F",
    surface: "#16171C",
    surfaceBorder: "rgba(255,255,255,0.07)",
    surfaceBorderStrong: "rgba(255,255,255,0.12)",
    tint: "#7D8BFF",
    icon: "#9A9EA8",
    tabIconDefault: "#9A9EA8",
    tabIconSelected: "#7D8BFF",

    primary: "#7D8BFF",
    primarySoft: "rgba(125,139,255,0.15)",
    danger: "#FF6B70",
    dangerBg: "rgba(229,72,77,0.16)",
    dangerBorder: "rgba(229,72,77,0.3)",
    sheetHandle: "#2C2E34",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
