import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedTextInput from "@/presentation/theme/components/ThemedTextInput";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Colors } from "@/constants/theme";
import React from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface RegisterWeightModalProps {
  visible: boolean;
  weight: string;
  weightUnit: string;
  note: string;
  onChangeWeight: (value: string) => void;
  onChangeWeightUnit: (value: string) => void;
  onChangeNote: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  modalBackground: string;
  borderColor: string;
  mutedText: string;
}

const WEIGHT_UNITS = ["kg", "lb"];

const RegisterWeightModal = ({
  visible,
  weight,
  weightUnit,
  note,
  onChangeWeight,
  onChangeWeightUnit,
  onChangeNote,
  onSubmit,
  onClose,
  modalBackground,
  borderColor,
  mutedText,
}: RegisterWeightModalProps) => {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: modalBackground, borderColor },
              ]}
            >
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Registrar nuevo peso
              </ThemedText>
              <ThemedText
                style={[styles.modalDescription, { color: mutedText }]}
              >
                Agrega el nuevo peso para mantener actualizado el historico.
              </ThemedText>

              <ThemedTextInput
                placeholder="Peso"
                keyboardType="numeric"
                value={weight}
                onChangeText={onChangeWeight}
              />

              <View style={styles.unitRow}>
                {WEIGHT_UNITS.map((unit) => (
                  <Pressable
                    key={unit}
                    onPress={() => onChangeWeightUnit(unit)}
                    style={[
                      styles.unitOption,
                      {
                        borderColor,
                        backgroundColor:
                          weightUnit === unit
                            ? Colors.light.primary
                            : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        { color: weightUnit === unit ? "#FFFFFF" : mutedText },
                      ]}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <ThemedTextInput
                placeholder="Nota (opcional)"
                value={note}
                onChangeText={onChangeNote}
              />

              <ThemedButton onPress={onSubmit}>Guardar peso</ThemedButton>

              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={[styles.cancelText, { color: mutedText }]}>
                  Cancelar
                </Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    marginBottom: 6,
  },
  modalDescription: {
    lineHeight: 22,
    marginBottom: 6,
  },
  unitRow: {
    flexDirection: "row",
    gap: 10,
  },
  unitOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  unitOptionText: {
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cancelButton: {
    marginTop: 4,
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default RegisterWeightModal;
