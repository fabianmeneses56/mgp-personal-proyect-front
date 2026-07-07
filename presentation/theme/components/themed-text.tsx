import { StyleSheet, Text, type TextProps } from "react-native";
import { Fonts } from "../fonts";
import { useThemeColor } from "../hooks/use-theme-color";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const linkColor = useThemeColor({}, "primary");

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? [styles.link, { color: linkColor }] : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts.medium,
    fontSize: 15.5,
    lineHeight: 23,
  },
  defaultSemiBold: {
    fontFamily: Fonts.bold,
    fontSize: 15.5,
    lineHeight: 23,
  },
  title: {
    fontFamily: Fonts.extrabold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontFamily: Fonts.extrabold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  link: {
    fontFamily: Fonts.bold,
    lineHeight: 22,
    fontSize: 15,
  },
});
