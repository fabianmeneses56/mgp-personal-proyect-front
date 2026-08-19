import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { useRef, useState } from "react";
import { Fonts } from "../fonts";
import { useThemeColors } from "../hooks/use-theme-colors";

interface Props extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;

  secureToggle?: boolean;
}

const ThemedTextInput = ({
  icon,
  style,
  secureToggle = false,
  ...rest
}: Props) => {
  const colors = useThemeColors();

  const [isActive, setIsActive] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const inputRef = useRef<TextInput>(null);

  return (
    <View
      style={[
        styles.border,
        {
          backgroundColor: colors.surface,
          borderColor: isActive ? colors.primary : colors.surfaceBorder,
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
          color={colors.textFaint}
          style={{ marginRight: 12 }}
        />
      )}

      <TextInput
        ref={inputRef}
        placeholderTextColor={colors.textFaint}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        style={{
          color: colors.text,
          fontFamily: Fonts.semibold,
          fontSize: 15.5,
          marginRight: 10,
          flex: 1,
        }}
        {...rest}
        secureTextEntry={secureToggle ? isSecure : rest.secureTextEntry}
      />

      {secureToggle && (
        <Pressable
          onPress={() => setIsSecure((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={
            isSecure ? "Mostrar contraseña" : "Ocultar contraseña"
          }
        >
          <Ionicons
            name={isSecure ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={isSecure ? colors.textFaint : colors.primary}
          />
        </Pressable>
      )}
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
