import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FullscreenImageModalProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

const FullscreenImageModal = ({
  visible,
  imageUrl,
  onClose,
}: FullscreenImageModalProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      transparent
      statusBarTranslucent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="contain"
        />
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeButton,
            { top: insets.top + 12, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
  },
  image: {
    flex: 1,
    width: "100%",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 999,
    padding: 8,
  },
});

export default FullscreenImageModal;
