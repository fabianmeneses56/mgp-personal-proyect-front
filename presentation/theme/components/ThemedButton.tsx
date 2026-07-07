import { Ionicons } from "@expo/vector-icons";
import { Pressable, PressableProps, StyleSheet, Text } from "react-native";
import { Fonts } from "../fonts";
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
          shadowColor: primaryColor,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        styles.button,
      ]}
      {...rest}
    >
      <Text style={styles.text}>{children}</Text>

      {icon && (
        <Ionicons
          name={icon}
          size={19}
          color="white"
          style={{ marginLeft: 8 }}
        />
      )}
    </Pressable>
  );
};
export default ThemedButton;

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 18,
    paddingVertical: 17,
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 4,
  },
  text: {
    fontFamily: Fonts.bold,
    color: "white",
    fontSize: 16,
  },
});
