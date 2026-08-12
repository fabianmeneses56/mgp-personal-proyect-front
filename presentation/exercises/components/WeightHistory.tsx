import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useWeightHistoryManager } from "@/presentation/weight-history/hooks/useWeightHistoryManager";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import AnimatedHistoryRowComponent from "./AnimatedHistoryRowComponent";

function HistorySkeleton({ color }: { color: string }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.historySkeletonRow,
            { backgroundColor: color },
            animatedStyle,
          ]}
        />
      ))}
    </>
  );
}

const WeightHistory = ({ exerciseId }: { exerciseId: string }) => {
  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "surfaceBorder");
  const faintText = useThemeColor({}, "textFaint");
  const primaryColor = useThemeColor({}, "primary");

  const {
    weightHistory,
    latestWeightEntry,
    isLoading,
    isError,
    refetch,
    removeEntry,
  } = useWeightHistoryManager(exerciseId);

  const swipeableRefs = useRef<Map<string, { close: () => void }>>(new Map());
  const openRowIdRef = useRef<string | null>(null);

  const openCreateWeightModal = () => {
    router.navigate({
      pathname: "/weight-entry",
      params: {
        exerciseId,
        ...(latestWeightEntry && {
          weight: latestWeightEntry.weight.toString(),
          weightUnit: latestWeightEntry.weightUnit,
        }),
      },
    });
  };

  const renderHistory = () => {
    if (isLoading) return <HistorySkeleton color={borderColor} />;

    if (isError)
      return (
        <View style={styles.historyErrorState}>
          <Text style={[styles.emptyHistory, { color: faintText }]}>
            No pudimos cargar el historial.
          </Text>
          <Pressable
            onPress={() => refetch()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Reintentar cargar el historial"
          >
            <Text style={[styles.retryText, { color: primaryColor }]}>
              Reintentar
            </Text>
          </Pressable>
        </View>
      );

    if (weightHistory.length === 0)
      return (
        <Text style={[styles.emptyHistory, { color: faintText }]}>
          Sin registros de peso
        </Text>
      );

    return weightHistory.map((entry) => (
      <AnimatedHistoryRowComponent
        key={entry.id}
        entry={entry}
        exerciseId={exerciseId}
        onRemove={removeEntry}
        swipeableRefs={swipeableRefs}
        openRowIdRef={openRowIdRef}
      />
    ));
  };

  return (
    <View
      style={[
        styles.historyCard,
        { backgroundColor: surfaceColor, borderColor },
      ]}
    >
      <ThemedText type="subtitle" style={styles.historyTitle}>
        Historico de pesos
      </ThemedText>

      {renderHistory()}

      <Pressable
        testID="exercise-add-weight-button"
        onPress={openCreateWeightModal}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.registerWeightButton,
          { backgroundColor: primaryColor, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.registerWeightButtonText}>
          Registrar nuevo peso
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  registerWeightButton: {
    marginTop: 2,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  registerWeightButtonText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  emptyHistory: {
    fontSize: 13.5,
    fontFamily: Fonts.semibold,
    textAlign: "center",
    paddingVertical: 8,
  },
  historyErrorState: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  retryText: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 19,
    gap: 12,
  },
  historyTitle: {
    marginBottom: 2,
  },
  historySkeletonRow: {
    height: 56,
    borderRadius: 14,
  },
});
export default WeightHistory;
