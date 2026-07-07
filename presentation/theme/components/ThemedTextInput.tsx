import { Ionicons } from "@expo/vector-icons";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { useRef, useState } from "react";
import { useThemeColor } from "../hooks/use-theme-color";

interface Props extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
}

const ThemedTextInput = ({ icon, style, ...rest }: Props) => {
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor(
    { light: "#DCE5FF", dark: "#33415C" },
    "background"
  );
  const placeholderColor = useThemeColor(
    { light: "#667085", dark: "#98A2B3" },
    "text"
  );

  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<TextInput>(null);

  return (
    <View
      style={[
        {
          ...styles.border,
          borderColor: isActive ? primaryColor : borderColor,
        },
        style as StyleProp<ViewStyle>,
      ]}
      onTouchStart={() => inputRef.current?.focus()}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={24}
          color={textColor}
          style={{ marginRight: 10 }}
        />
      )}

      <TextInput
        ref={inputRef}
        placeholderTextColor={placeholderColor}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        style={{
          color: textColor,
          marginRight: 10,
          flex: 1,
        }}
        {...rest}
      />
    </View>
  );
};
export default ThemedTextInput;

const styles = StyleSheet.create({
  border: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
});
