import BottomSheetModal from "@/presentation/theme/components/BottomSheetModal";
import { Fonts } from "@/presentation/theme/fonts";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedTextInput from "@/presentation/theme/components/ThemedTextInput";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

interface RegisterWeightModalProps {
  visible: boolean;
  weight: string;
  weightUnit: string;
  note: string;
  date: Date;
  showDatePicker: boolean;
  title?: string;
  submitLabel?: string;
  onChangeWeight: (value: string) => void;
  onChangeWeightUnit: (value: string) => void;
  onChangeNote: (value: string) => void;
  onPressDate: () => void;
  onChangeDate: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const WEIGHT_UNITS = ["kg", "lb"];

const RegisterWeightModal = ({
  visible,
  weight,
  weightUnit,
  note,
  date,
  showDatePicker,
  title = "Registrar nuevo peso",
  submitLabel = "Guardar peso",
  onChangeWeight,
  onChangeWeightUnit,
  onChangeNote,
  onPressDate,
  onChangeDate,
  onSubmit,
  onClose,
}: RegisterWeightModalProps) => {
  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "surfaceBorder");
  const primaryColor = useThemeColor({}, "primary");
  const mutedText = useThemeColor({}, "textMuted");
  const faintText = useThemeColor({}, "textFaint");
  const textColor = useThemeColor({}, "text");

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <ThemedText type="subtitle" style={styles.modalTitle}>
        {title}
      </ThemedText>

      <ThemedTextInput
        placeholder="Peso"
        keyboardType="numeric"
        value={weight}
        onChangeText={onChangeWeight}
        autoFocus
      />

      <View style={[styles.unitToggle, { backgroundColor: borderColor }]}>
        {WEIGHT_UNITS.map((unit) => (
          <Pressable
            key={unit}
            onPress={() => onChangeWeightUnit(unit)}
            style={[
              styles.unitOption,
              weightUnit === unit && { backgroundColor: surfaceColor },
            ]}
          >
            <Text
              style={[
                styles.unitOptionText,
                { color: weightUnit === unit ? primaryColor : faintText },
              ]}
            >
              {unit.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <ThemedTextInput
        placeholder="Nota (opcional)"
        value={note}
        onChangeText={onChangeNote}
      />

      <Pressable
        onPress={onPressDate}
        style={[styles.dateField, { backgroundColor: surfaceColor, borderColor }]}
      >
        <View>
          <Text style={[styles.dateFieldLabel, { color: faintText }]}>Fecha</Text>
          <Text style={[styles.dateFieldValue, { color: textColor }]}>
            {date.toLocaleDateString()}
          </Text>
        </View>
        <Ionicons name="calendar-outline" size={20} color={faintText} />
      </Pressable>

      {showDatePicker && Platform.OS === "ios" ? (
        <View>
          <DateTimePicker
            value={date}
            mode="date"
            display="inline"
            onChange={onChangeDate}
          />
          <View style={styles.doneButtonWrapper}>
            <ThemedButton onPress={onPressDate}>Listo</ThemedButton>
          </View>
        </View>
      ) : null}

      {showDatePicker && Platform.OS === "android" ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      ) : null}

      <View style={styles.submitButtonWrapper}>
        <ThemedButton onPress={onSubmit}>{submitLabel}</ThemedButton>
      </View>

      <Pressable style={styles.cancelButton} onPress={onClose}>
        <Text style={[styles.cancelText, { color: mutedText }]}>Cancelar</Text>
      </Pressable>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    marginBottom: 16,
  },
  unitToggle: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 11,
  },
  unitOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 11,
  },
  unitOptionText: {
    fontFamily: Fonts.extrabold,
    fontSize: 14,
  },
  dateField: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateFieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10.5,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  dateFieldValue: {
    marginTop: 2,
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  doneButtonWrapper: {
    marginTop: 8,
    marginBottom: 4,
  },
  submitButtonWrapper: {
    marginTop: 5,
  },
  cancelButton: {
    marginTop: 6,
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 4,
  },
  cancelText: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
});

export default RegisterWeightModal;
