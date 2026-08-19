import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  ActivityItem,
  ActivityType,
} from "@/core/activity/interfaces/activity.interface";
import { toDisplayWeight } from "@/core/weight-history/interfaces/weight-history.interface";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";

const ACTIVITY_ICON: Record<ActivityType, keyof typeof Ionicons.glyphMap> = {
  category: "folder-outline",
  exercise: "barbell-outline",
  weight_history: "trending-up-outline",
};

interface PhrasePart {
  text: string;
  bold: boolean;
}

function formatWeight(item: ActivityItem): string {
  const weightUnit = item.weightUnit ?? "kg";
  const weight = toDisplayWeight(item.weightGrams ?? 0, weightUnit);
  return `${weight} ${weightUnit}`;
}

function buildPhraseParts(item: ActivityItem): PhrasePart[] {
  if (item.type === "category") {
    const verb =
      item.action === "created"
        ? "Creaste la categoría"
        : "Editaste la categoría";
    return [
      { text: `${verb} `, bold: false },
      { text: item.description, bold: true },
    ];
  }

  if (item.type === "exercise") {
    const verb =
      item.action === "created"
        ? "Creaste el ejercicio"
        : "Editaste el ejercicio";
    return [
      { text: `${verb} `, bold: false },
      { text: item.description, bold: true },
    ];
  }

  const prefix =
    item.action === "created" ? "Registraste " : "Editaste un registro de ";
  return [
    { text: prefix, bold: false },
    { text: formatWeight(item), bold: true },
    { text: " en ", bold: false },
    { text: item.description, bold: true },
  ];
}

function formatTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

interface Props {
  item: ActivityItem;
}

const ActivityRow = ({ item }: Props) => {
  const colors = useThemeColors();

  const phraseParts = buildPhraseParts(item);

  return (
    <View style={styles.row}>
      <View
        style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}
      >
        <Ionicons
          name={ACTIVITY_ICON[item.type]}
          size={18}
          color={colors.primary}
        />
      </View>

      <Text style={[styles.phrase, { color: colors.text }]}>
        {phraseParts.map((part, index) => (
          <Text key={index} style={part.bold ? styles.phraseBold : undefined}>
            {part.text}
          </Text>
        ))}
      </Text>

      <Text style={[styles.time, { color: colors.textFaint }]}>
        {formatTime(item.createdAt)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  phrase: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 14.5,
    lineHeight: 21,
  },
  phraseBold: {
    fontFamily: Fonts.bold,
  },
  time: {
    fontFamily: Fonts.semibold,
    fontSize: 12.5,
  },
});

export default ActivityRow;
