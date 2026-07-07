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
import { Fonts } from "../fonts";
import { useThemeColor } from "../hooks/use-theme-color";

interface Props extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
}

const ThemedTextInput = ({ icon, style, ...rest }: Props) => {
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "surfaceBorder");
  const placeholderColor = useThemeColor({}, "textFaint");

  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<TextInput>(null);

  return (
    <View
      style={[
        styles.border,
        {
          backgroundColor: surfaceColor,
          borderColor: isActive ? primaryColor : borderColor,
          borderWidth: isActive ? 1.5 : 1,
        },
        style as StyleProp<ViewStyle>,
      ]}
      onTouchStart={() => inputRef.current?.focus()}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={placeholderColor}
          style={{ marginRight: 12 }}
        />
      )}

      <TextInput
        ref={inputRef}
        placeholderTextColor={placeholderColor}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        style={{
          color: textColor,
          fontFamily: Fonts.semibold,
          fontSize: 15.5,
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
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
  },
});
