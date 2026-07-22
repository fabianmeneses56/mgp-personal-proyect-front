import React, { useState } from "react";
import { Alert, Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";

import { useWeightHistory } from "@/presentation/weight-history/hooks/useWeightHistory";
import { Fonts } from "@/presentation/theme/fonts";
import SheetScreen from "@/presentation/theme/components/SheetScreen";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedTextInput from "@/presentation/theme/components/ThemedTextInput";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";

const WEIGHT_UNITS = ["kg", "lb"];

const WeightEntryScreen = () => {
  const params = useLocalSearchParams<{
    exerciseId: string;
    entryId?: string;
    weight?: string;
    weightUnit?: string;
    note?: string;
    date?: string;
  }>();
  const { exerciseId, entryId } = params;
  const isEditing = !!entryId;

  const { createMutation, updateMutation } = useWeightHistory(
    String(exerciseId)
  );

  const [weight, setWeight] = useState(params.weight ?? "");
  const [weightUnit, setWeightUnit] = useState(params.weightUnit || "kg");
  const [note, setNote] = useState(params.note ?? "");
  const [date, setDate] = useState(() =>
    params.date ? new Date(params.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "surfaceBorder");
  const primaryColor = useThemeColor({}, "primary");
  const mutedText = useThemeColor({}, "textMuted");
  const faintText = useThemeColor({}, "textFaint");
  const textColor = useThemeColor({}, "text");

  const toggleDatePicker = () => {
    Keyboard.dismiss();
    setShowDatePicker((prev) => !prev);
  };

  const handleChangeDate = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    const normalizedWeight = weight.trim().replace(",", ".");
    const parsedWeight = Number(normalizedWeight);

    if (!normalizedWeight || Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert("Peso invalido", "Ingresa un peso numerico mayor a 0.");
      return;
    }

    const payload = {
      weight: parsedWeight,
      weightUnit,
      note: note.trim() ? note.trim() : undefined,
      date: date.toISOString(),
    };

    try {
      if (entryId) {
        await updateMutation.mutateAsync({ entryId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      // El Alert de error ya lo dispara useWeightHistory (onError de la mutacion);
      // el modal permanece abierto para que el usuario pueda reintentar.
    }
  };

  return (
    <SheetScreen>
      <ThemedText type="subtitle" style={styles.modalTitle}>
        {isEditing ? "Editar peso" : "Registrar nuevo peso"}
      </ThemedText>

      <ThemedTextInput
        placeholder="Peso"
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={setWeight}
        autoFocus
      />

      <View style={[styles.unitToggle, { backgroundColor: borderColor }]}>
        {WEIGHT_UNITS.map((unit) => (
          <Pressable
            key={unit}
            onPress={() => setWeightUnit(unit)}
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
        onChangeText={setNote}
      />

      <Pressable
        onPress={toggleDatePicker}
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
            onChange={handleChangeDate}
          />
          <View style={styles.doneButtonWrapper}>
            <ThemedButton onPress={toggleDatePicker}>Listo</ThemedButton>
          </View>
        </View>
      ) : null}

      {showDatePicker && Platform.OS === "android" ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleChangeDate}
        />
      ) : null}

      <View style={styles.submitButtonWrapper}>
        <ThemedButton onPress={handleSubmit} disabled={isSaving}>
          {isSaving
            ? "Guardando..."
            : isEditing
              ? "Guardar cambios"
              : "Guardar peso"}
        </ThemedButton>
      </View>

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={isSaving}
      >
        <Text style={[styles.cancelText, { color: mutedText }]}>Cancelar</Text>
      </Pressable>
    </SheetScreen>
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

export default WeightEntryScreen;
