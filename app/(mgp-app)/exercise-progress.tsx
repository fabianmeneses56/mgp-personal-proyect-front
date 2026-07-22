import { WeightProgressChart } from "@/presentation/weight-history/components/WeightProgressChart";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useWeightHistory } from "@/presentation/weight-history/hooks/useWeightHistory";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const ExerciseProgressScreen = () => {
  const { exerciseId, name } = useLocalSearchParams<{
    exerciseId: string;
    name?: string;
  }>();

  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "surfaceBorder");
  const faintText = useThemeColor({}, "textFaint");
  const mutedText = useThemeColor({}, "textMuted");
  const primaryColor = useThemeColor({}, "primary");

  const { weightHistory, isLoading, isError, refetch } = useWeightHistory(
    String(exerciseId),
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ThemedText type="subtitle" style={styles.title}>
        {name ? String(name) : "Progreso"}
      </ThemedText>

      <View
        style={[styles.chartCard, { backgroundColor: surfaceColor, borderColor }]}
      >
        {isLoading ? (
          <View style={styles.stateWrapper}>
            <Text style={[styles.stateText, { color: faintText }]}>
              Cargando historial...
            </Text>
          </View>
        ) : isError ? (
          <View style={styles.stateWrapper}>
            <Text style={[styles.stateText, { color: faintText }]}>
              No pudimos cargar el historial.
            </Text>
            <Pressable onPress={() => refetch()} hitSlop={8}>
              <Text style={[styles.retryText, { color: primaryColor }]}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        ) : weightHistory.length < 2 ? (
          <View style={styles.stateWrapper}>
            <Text style={[styles.stateText, { color: faintText }]}>
              Registra al menos 2 pesos para ver tu progreso
            </Text>
          </View>
        ) : (
          <WeightProgressChart entries={weightHistory} variant="full" />
        )}
      </View>

      <Text style={[styles.hint, { color: mutedText }]}>
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
