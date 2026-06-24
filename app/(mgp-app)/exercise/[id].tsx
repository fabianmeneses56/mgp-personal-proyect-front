import { Colors } from "@/constants/theme";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import { StyleSheet, View } from "react-native";

const ExerciseDetailScreen = () => {
  const { name, weightGrams, weight, weightUnit, categoryName } =
    useLocalSearchParams<{
    id: string;
    name?: string;
    weightGrams?: string;
    weight?: string;
    weightUnit?: string;
    categoryName?: string;
    }>();
  const navigation = useNavigation();
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

  const displayWeight =
    weight && weight !== "" ? `${weight} ${weightUnit || "kg"}` : `${weightGrams ?? "0"} g`;

  useLayoutEffect(() => {
    if (name) {
      navigation.setOptions({ title: String(name) });
    }
  }, [name, navigation]);

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
});

export default ExerciseDetailScreen;
