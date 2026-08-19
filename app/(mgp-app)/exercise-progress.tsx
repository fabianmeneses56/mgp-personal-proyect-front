import { WeightProgressChart } from "@/presentation/weight-history/components/WeightProgressChart";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";
import { useWeightHistoryManager } from "@/presentation/weight-history/hooks/useWeightHistoryManager";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const ExerciseProgressScreen = () => {
  const { exerciseId, name } = useLocalSearchParams<{
    exerciseId: string;
    name?: string;
  }>();

  const colors = useThemeColors();

  const { weightHistory, isLoading, isError, refetch } = useWeightHistoryManager(
    String(exerciseId),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedText type="subtitle" style={styles.title}>
        {name ? String(name) : "Progreso"}
      </ThemedText>

      <View
        style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
      >
        {isLoading ? (
          <View style={styles.stateWrapper}>
            <Text style={[styles.stateText, { color: colors.textFaint }]}>
              Cargando historial...
            </Text>
          </View>
        ) : isError ? (
          <View style={styles.stateWrapper}>
            <Text style={[styles.stateText, { color: colors.textFaint }]}>
              No pudimos cargar el historial.
            </Text>
            <Pressable onPress={() => refetch()} hitSlop={8}>
              <Text style={[styles.retryText, { color: colors.primary }]}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        ) : weightHistory.length < 2 ? (
          <View style={styles.stateWrapper}>
            <Text style={[styles.stateText, { color: colors.textFaint }]}>
              Registra al menos 2 pesos para ver tu progreso
            </Text>
          </View>
        ) : (
          <WeightProgressChart entries={weightHistory} variant="full" />
        )}
      </View>

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Toca un punto de la gráfica para ver el detalle de ese registro.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 20,
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    minHeight: 300,
    justifyContent: "center",
  },
  stateWrapper: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 40,
  },
  stateText: {
    fontFamily: Fonts.semibold,
    fontSize: 13.5,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  retryText: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
  },
  hint: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    textAlign: "center",
  },
});

export default ExerciseProgressScreen;
