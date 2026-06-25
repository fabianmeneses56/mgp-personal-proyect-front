import { deleteExercise } from "@/core/exercises/actions/delete-exercise.action";
import { Colors } from "@/constants/theme";
import RegisterWeightModal from "@/presentation/exercises/components/RegisterWeightModal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useLayoutEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

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
  )[0];
  const displayWeight = `${latestWeightEntry.weight} ${latestWeightEntry.weightUnit}`;

  const [modalVisible, setModalVisible] = useState(false);
  const [formWeight, setFormWeight] = useState("");
  const [formWeightUnit, setFormWeightUnit] = useState("kg");
  const [formNote, setFormNote] = useState("");

  const closeWeightModal = () => {
    setFormWeight("");
    setFormWeightUnit("kg");
    setFormNote("");
    setModalVisible(false);
  };

  const handleSubmitWeight = () => {
    const parsedWeight = Number(formWeight);

    if (!formWeight.trim() || Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert("Peso invalido", "Ingresa un peso numerico mayor a 0.");
      return;
    }

    const newEntry: WeightHistoryEntry = {
      id: Date.now().toString(),
      weight: parsedWeight,
      weightUnit: formWeightUnit,
      note: formNote.trim() ? formNote.trim() : undefined,
      date: new Date().toISOString(),
    };

    setWeightHistory((prev) => [newEntry, ...prev]);
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
    <View style={styles.container}>
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

        {[...weightHistory]
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .map((entry) => (
            <View
              key={entry.id}
              style={[styles.historyRow, { borderColor }]}
            >
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
          ))}

        <Pressable
          onPress={() => setModalVisible(true)}
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
        onChangeWeight={setFormWeight}
        onChangeWeightUnit={setFormWeightUnit}
        onChangeNote={setFormNote}
        onSubmit={handleSubmitWeight}
        onClose={closeWeightModal}
        modalBackground={modalBackground}
        borderColor={borderColor}
        mutedText={mutedText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 18,
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
  historyRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 4,
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
