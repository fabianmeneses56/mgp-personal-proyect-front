import { Exercise } from "@/core/categories/interfaces/category.interface";
import { toDisplayWeight } from "@/core/weight-history/interfaces/weight-history.interface";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const getExerciseWeightLabel = (exercise: Exercise) => {
  if (exercise.weight !== undefined) {
    return `${exercise.weight} ${exercise.weightUnit ?? "kg"}`;
  }

  if (exercise.weightGrams !== undefined) {
    const unit = exercise.weightUnit ?? "kg";
    return `${toDisplayWeight(exercise.weightGrams, unit)} ${unit}`;
  }

  return "0 kg";
};

const RenderExerciseCard = ({
  item,
  index,
  categoryName,
  onDelete,
  isDeleting,
}: {
  item: Exercise;
  index: number;
  categoryName: string;
  onDelete: (exercise: Exercise) => void;
  isDeleting: boolean;
}) => {
  const colors = useThemeColors();

  return (
    <Pressable
      testID={`exercise-row-${item.name}`}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({
          pathname: "/exercise/[id]",
          params: {
            id: item.id ?? `${item.name}-${index}`,
            name: item.name,
            categoryName,
            imageUrl: String(item.imageUrl ?? ""),
          },
        });
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.badge,
          {
            backgroundColor: colors.background,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <Text style={[styles.badgeText, { color: colors.primary }]}>
          {index + 1}
        </Text>
      </View>

      <View style={styles.cardInfo}>
        <ThemedText
          type="defaultSemiBold"
          style={styles.exerciseName}
          numberOfLines={1}
        >
          {item.name}
        </ThemedText>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: colors.textFaint }]}>
            Peso
          </Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>
            {getExerciseWeightLabel(item)}
          </Text>
        </View>
      </View>

      <Pressable
        testID={`exercise-delete-button-${item.name}`}
        onPress={() => onDelete(item)}
        disabled={isDeleting}
        hitSlop={6}
        style={({ pressed }) => [
          styles.rowActionCircle,
          {
            backgroundColor: colors.dangerBg,
            opacity: pressed || isDeleting ? 0.6 : 1,
          },
        ]}
      >
        <Ionicons name="trash-outline" size={15} color={colors.danger} />
      </Pressable>

      <View
        style={[
          styles.rowActionCircle,
          { backgroundColor: colors.primarySoft },
        ]}
      >
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  rowActionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  metaLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10.5,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metaValue: {
    fontFamily: Fonts.extrabold,
    fontSize: 14,
  },
  cardInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    letterSpacing: -0.2,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontWeight: "800",
    fontSize: 15,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
  },
});

export default RenderExerciseCard;
