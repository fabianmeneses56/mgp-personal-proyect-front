import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "../hooks/use-theme-colors";

interface SheetScreenProps {
  children: React.ReactNode;
}

// Contenido de las rutas presentadas como formSheet nativo. Con
// sheetAllowedDetents: "fitToContents" el contenido no debe usar flex: 1.
const SheetScreen = ({ children }: SheetScreenProps) => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.sheet,
        { paddingBottom: Math.max(insets.bottom, 20) + 10 },
      ]}
    >
      {Platform.OS === "android" ? (
        // sheetGrabberVisible solo existe en iOS; en Android dibujamos el handle.
        <View
          style={[styles.handle, { backgroundColor: colors.sheetHandle }]}
        />
      ) : null}
      {children}
    </View>
  );
};

export default SheetScreen;

const styles = StyleSheet.create({
  sheet: {
    paddingTop: Platform.OS === "ios" ? 24 : 14,
    paddingHorizontal: 22,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 20,
  },
});
