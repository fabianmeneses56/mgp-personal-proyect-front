import { Ionicons } from "@expo/vector-icons";
import { Pressable, PressableProps, StyleSheet, Text } from "react-native";
import { useThemeColor } from "../hooks/use-theme-color";

interface Props extends PressableProps {
  children: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const ThemedButton = ({ children, icon, disabled, ...rest }: Props) => {
  const primaryColor = useThemeColor({}, "primary");

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: primaryColor,
          opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
        },
        styles.button,
      ]}
      {...rest}
    >
      <Text style={styles.text}>{children}</Text>

      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color="white"
          style={{ marginHorizontal: 5 }}
        />
      )}
    </Pressable>
  );
};
export default ThemedButton;

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    minHeight: 50,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});
