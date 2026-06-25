import { deleteExercise } from "@/core/exercises/actions/delete-exercise.action";
import { Colors } from "@/constants/theme";
import RegisterWeightModal from "@/presentation/exercises/components/RegisterWeightModal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useLayoutEffect, useState } from "react";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface WeightHistoryEntry {
  id: string;
  weight: number;
  weightUnit: string;
  note?: string;
  date: string;
}

const ExerciseDetailScreen = () => {
  const { id, name, weightGrams, weight, weightUnit, categoryName } =
    useLocalSearchParams<{
    id: string;
    name?: string;
    weightGrams?: string;
    weight?: string;
    weightUnit?: string;
    categoryName?: string;
    }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const cardBackground = useThemeColor(
    { light: "#F7F8FC", dark: "#20242C" },
    "background"
  );
  const borderColor = useThemeColor(
    { light: "#DCE5FF", dark: "#33415C" },
    "background"
  );
  const mutedText = useThemeColor(
    { light: "#667085", dark: "#98A2B3" },
    "text"
  );
  const dangerBackground = useThemeColor(
    { light: "#FFF1F2", dark: "#3A1E23" },
    "background"
  );
  const dangerBorder = useThemeColor(
    { light: "#FBCDD2", dark: "#6E2933" },
    "background"
  );
  const dangerText = useThemeColor(
    { light: "#B42318", dark: "#FF8A80" },
    "text"
  );
  const modalBackground = useThemeColor(
    { light: "#FFFFFF", dark: "#151718" },
    "background"
  );

  const initialWeightValue =
    weight && weight !== ""
      ? Number(weight)
      : weightGrams
        ? Number(weightGrams) / 1000
        : 0;
  const initialWeightUnit = weightUnit || "kg";

  const [weightHistory, setWeightHistory] = useState<WeightHistoryEntry[]>([
    {
      id: "initial",
      weight: initialWeightValue,
      weightUnit: initialWeightUnit,
      date: new Date().toISOString(),
    },
  ]);

  const latestWeightEntry = [...weightHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0] ?? null;
  const displayWeight = latestWeightEntry
    ? `${latestWeightEntry.weight} ${latestWeightEntry.weightUnit}`
    : "Sin registros";

  const [modalVisible, setModalVisible] = useState(false);
  const [formWeight, setFormWeight] = useState("");
  const [formWeightUnit, setFormWeightUnit] = useState("kg");
  const [formNote, setFormNote] = useState("");
  const [formDate, setFormDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const closeWeightModal = () => {
    setFormWeight("");
    setFormWeightUnit("kg");
    setFormNote("");
    setFormDate(new Date());
    setShowDatePicker(false);
    setEditingEntryId(null);
    setModalVisible(false);
  };

  const handleEditEntry = (entry: WeightHistoryEntry) => {
    setEditingEntryId(entry.id);
    setFormWeight(entry.weight.toString());
    setFormWeightUnit(entry.weightUnit);
    setFormNote(entry.note ?? "");
    setFormDate(new Date(entry.date));
    setShowDatePicker(false);
    setModalVisible(true);
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert(
      "Eliminar registro",
      "¿Seguro que quieres eliminar esta entrada del historial?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () =>
            setWeightHistory((prev) => prev.filter((e) => e.id !== entryId)),
        },
      ]
    );
  };

  const openCreateWeightModal = () => {
    setEditingEntryId(null);
    setFormWeight("");
    setFormWeightUnit("kg");
    setFormNote("");
    setFormDate(new Date());
    setModalVisible(true);
  };

  const toggleDatePicker = () => {
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
      setFormDate(selectedDate);
    }
  };

  const handleSubmitWeight = () => {
    const parsedWeight = Number(formWeight);

    if (!formWeight.trim() || Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert("Peso invalido", "Ingresa un peso numerico mayor a 0.");
      return;
    }

    if (editingEntryId) {
      setWeightHistory((prev) =>
        prev.map((e) =>
          e.id === editingEntryId
            ? {
                ...e,
                weight: parsedWeight,
                weightUnit: formWeightUnit,
                note: formNote.trim() ? formNote.trim() : undefined,
                date: formDate.toISOString(),
              }
            : e
        )
      );
    } else {
      const newEntry: WeightHistoryEntry = {
        id: Date.now().toString(),
        weight: parsedWeight,
        weightUnit: formWeightUnit,
        note: formNote.trim() ? formNote.trim() : undefined,
        date: formDate.toISOString(),
      };
      setWeightHistory((prev) => [newEntry, ...prev]);
    }

    closeWeightModal();
  };

  const deleteExerciseMutation = useMutation({
    mutationFn: deleteExercise,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      router.back();
      Alert.alert(
        "Ejercicio eliminado",
        `${String(name ?? "El ejercicio")} se elimino correctamente`
      );
    },
    onError(error) {
      Alert.alert("Error", error.message);
    },
  });

  const confirmDeleteExercise = useCallback(() => {
    Alert.alert(
      "Eliminar ejercicio",
      `Se eliminara ${String(name ?? "este ejercicio")} y ya no aparecera en tu lista.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: deleteExerciseMutation.isPending ? "Eliminando..." : "Eliminar",
          style: "destructive",
          onPress: () => deleteExerciseMutation.mutate(String(id)),
        },
      ]
    );
  }, [deleteExerciseMutation, id, name]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name ? String(name) : undefined,
      headerRight: () => (
        <Pressable
          onPress={confirmDeleteExercise}
          disabled={deleteExerciseMutation.isPending}
          style={({ pressed }) => [
            styles.deleteHeaderButton,
            { opacity: pressed || deleteExerciseMutation.isPending ? 0.75 : 1 },
          ]}
        >
          <Ionicons name="trash-outline" size={22} color={dangerText} />
        </Pressable>
      ),
    });
  }, [
    confirmDeleteExercise,
    dangerText,
    deleteExerciseMutation.isPending,
    name,
    navigation,
  ]);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View
        style={[
          styles.heroCard,
          { backgroundColor: cardBackground, borderColor },
        ]}
      >
        <View style={styles.heroBadge}>
          <ThemedText style={styles.heroBadgeText}>Detalle</ThemedText>
        </View>

        <ThemedText type="title" style={styles.title}>
          {name ?? "Ejercicio"}
        </ThemedText>

        <ThemedText style={[styles.subtitle, { color: mutedText }]}>
          Categoria: {categoryName ?? "Sin categoria"}
        </ThemedText>
      </View>

      <View
        style={[
          styles.metricCard,
          { backgroundColor: cardBackground, borderColor },
        ]}
      >
        <ThemedText style={[styles.metricLabel, { color: mutedText }]}>
          Peso asignado
        </ThemedText>
        <ThemedText style={styles.metricValue}>{displayWeight}</ThemedText>
        <ThemedText style={[styles.metricHint, { color: mutedText }]}>
          Usa este valor para identificar rapidamente la carga del ejercicio.
        </ThemedText>
      </View>

      <View
        style={[
          styles.historyCard,
          { backgroundColor: cardBackground, borderColor },
        ]}
      >
        <ThemedText type="subtitle" style={styles.historyTitle}>
          Historico de pesos
        </ThemedText>

        {weightHistory.length === 0 ? (
          <ThemedText style={[styles.emptyHistory, { color: mutedText }]}>
            Sin registros de peso
          </ThemedText>
        ) : null}

        {[...weightHistory]
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .map((entry) => (
            <View key={entry.id} style={[styles.historyRowWrapper, { borderColor }]}>
              <ReanimatedSwipeable
                friction={2}
                overshootRight={false}
                renderRightActions={() => (
                  <View style={styles.swipeActions}>
                    <Pressable
                      onPress={() => handleEditEntry(entry)}
                      style={[styles.swipeActionEdit, { backgroundColor: Colors.light.primary }]}
                    >
                      <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.swipeActionText}>Editar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteEntry(entry.id)}
                      style={[styles.swipeActionDelete, { backgroundColor: "#C0392B" }]}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.swipeActionText}>Eliminar</Text>
                    </Pressable>
                  </View>
                )}
              >
                <View style={[styles.historyRow, { backgroundColor: cardBackground }]}>
                  <View style={styles.historyRowTop}>
                    <ThemedText style={styles.historyWeight}>
                      {entry.weight} {entry.weightUnit}
                    </ThemedText>
                    <ThemedText style={[styles.historyDate, { color: mutedText }]}>
                      {new Date(entry.date).toLocaleDateString()}
                    </ThemedText>
                  </View>
                  {entry.note ? (
                    <ThemedText style={[styles.historyNote, { color: mutedText }]}>
                      {entry.note}
                    </ThemedText>
                  ) : null}
                </View>
              </ReanimatedSwipeable>
            </View>
          ))}

        <Pressable
          onPress={openCreateWeightModal}
          style={({ pressed }) => [
            styles.registerWeightButton,
            { opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <Text style={styles.registerWeightButtonText}>
            Registrar nuevo peso
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.dangerZone,
          { backgroundColor: dangerBackground, borderColor: dangerBorder },
        ]}
      >
        <View style={styles.dangerZoneHeader}>
          <Ionicons name="warning-outline" size={22} color={dangerText} />
          <ThemedText style={[styles.dangerZoneTitle, { color: dangerText }]}>
            Zona de peligro
          </ThemedText>
        </View>
        <ThemedText style={[styles.dangerZoneDescription, { color: mutedText }]}>
          Si ya no necesitas este ejercicio, puedes eliminarlo desde aqui.
        </ThemedText>
        <Pressable
          onPress={confirmDeleteExercise}
          disabled={deleteExerciseMutation.isPending}
          style={({ pressed }) => [
            styles.deleteExerciseButton,
            {
              backgroundColor: dangerText,
              opacity: pressed || deleteExerciseMutation.isPending ? 0.82 : 1,
            },
          ]}
        >
          <Text style={styles.deleteExerciseButtonText}>
            {deleteExerciseMutation.isPending
              ? "Eliminando ejercicio..."
              : "Eliminar ejercicio"}
          </Text>
        </Pressable>
      </View>

      <RegisterWeightModal
        visible={modalVisible}
        weight={formWeight}
        weightUnit={formWeightUnit}
        note={formNote}
        date={formDate}
        showDatePicker={showDatePicker}
        title={editingEntryId ? "Editar peso" : "Registrar nuevo peso"}
        submitLabel={editingEntryId ? "Guardar cambios" : "Guardar peso"}
        onChangeWeight={setFormWeight}
        onChangeWeightUnit={setFormWeightUnit}
        onChangeNote={setFormNote}
        onPressDate={toggleDatePicker}
        onChangeDate={handleChangeDate}
        onSubmit={handleSubmitWeight}
        onClose={closeWeightModal}
        modalBackground={modalBackground}
        borderColor={borderColor}
        mutedText={mutedText}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 18,
    paddingBottom: 40,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(61, 100, 244, 0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  heroBadgeText: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  metricCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    gap: 8,
  },
  metricLabel: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  metricHint: {
    fontSize: 15,
    lineHeight: 22,
  },
  deleteHeaderButton: {
    padding: 4,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    gap: 14,
  },
  historyTitle: {
    marginBottom: 4,
  },
  emptyHistory: {
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 8,
  },
  historyRowWrapper: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  historyRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 4,
    minHeight: 56,
    justifyContent: "center",
  },
  historyRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyWeight: {
    fontSize: 17,
    fontWeight: "700",
  },
  historyDate: {
    fontSize: 13,
  },
  historyNote: {
    fontSize: 14,
    lineHeight: 20,
  },
  swipeActions: {
    flexDirection: "row",
    width: 136,
    alignSelf: "stretch",
  },
  swipeActionEdit: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    gap: 4,
    paddingVertical: 8,
  },
  swipeActionDelete: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    gap: 4,
    paddingVertical: 8,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.25)",
  },
  swipeActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  registerWeightButton: {
    marginTop: 4,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
  },
  registerWeightButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  dangerZone: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    gap: 12,
  },
  dangerZoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  dangerZoneDescription: {
    lineHeight: 22,
  },
  deleteExerciseButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteExerciseButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default ExerciseDetailScreen;
