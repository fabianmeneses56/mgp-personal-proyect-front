import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "../hooks/use-theme-color";

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const BottomSheetModal = ({
  visible,
  onClose,
  children,
}: BottomSheetModalProps) => {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const backdropColor = useThemeColor({}, "sheetBackdrop");
  const handleColor = useThemeColor({}, "sheetHandle");

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: backdropColor }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor,
              paddingBottom: Math.max(insets.bottom, 20) + 10,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: handleColor }]} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default BottomSheetModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingTop: 14,
    paddingHorizontal: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.3,
    shadowRadius: 50,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 20,
  },
});
