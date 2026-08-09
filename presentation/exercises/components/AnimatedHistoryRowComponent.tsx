import { WeightHistoryEntry } from "@/core/weight-history/interfaces/weight-history.interface";
import { showConfirm, showOptions } from "@/helpers/alerts/alert.service";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
const SWIPE_ACTIONS_WIDTH = 136;

function SwipeRightActions({
  drag,
  primaryColor,
  onEdit,
  onDelete,
}: {
  drag: SharedValue<number>;
  primaryColor: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          drag.value,
          [-SWIPE_ACTIONS_WIDTH, 0],
          [0, SWIPE_ACTIONS_WIDTH],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  return (
    <Animated.View style={[styles.swipeActions, animatedStyle]}>
      <Pressable
        onPress={onEdit}
        style={[styles.swipeActionEdit, { backgroundColor: primaryColor }]}
      >
        <Ionicons name="create-outline" size={18} color="#FFFFFF" />
        <Text style={styles.swipeActionText}>Editar</Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        style={[styles.swipeActionDelete, { backgroundColor: "#C0392B" }]}
      >
        <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
        <Text style={styles.swipeActionText}>Eliminar</Text>
      </Pressable>
    </Animated.View>
  );
}

function AnimatedHistoryRow({
  isDeleting,
  onRemoveComplete,
  children,
}: {
  isDeleting: boolean;
  onRemoveComplete: () => void;
  children: React.ReactNode;
}) {
  const opacity = useSharedValue(1);
  const height = useSharedValue<number | null>(null);

  useEffect(() => {
    if (!isDeleting) return;
    opacity.value = withTiming(0, { duration: 180 }, (opacityDone) => {
      if (!opacityDone) return;
      height.value = withTiming(0, { duration: 200 }, (heightDone) => {
        if (heightDone) runOnJS(onRemoveComplete)();
      });
    });
  }, [isDeleting]);

  const animatedStyle = useAnimatedStyle(() => {
    const style: ViewStyle = { opacity: opacity.value, overflow: "hidden" };
    if (height.value !== null) {
      style.height = height.value;
    }
    return style;
  });

  return (
    <Animated.View
      style={animatedStyle}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (height.value === null && h > 0) {
          // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value mutation, not React state
          height.value = h;
        }
      }}
    >
      {children}
    </Animated.View>
  );
}

const AnimatedHistoryRowComponent = ({
  entry,
  exerciseId,
  onRemove,
  swipeableRefs,
  openRowIdRef,
}: {
  entry: WeightHistoryEntry;
  exerciseId: string;
  onRemove: (entryId: string) => void;
  swipeableRefs: React.RefObject<Map<string, { close: () => void }>>;
  openRowIdRef: React.RefObject<string | null>;
}) => {
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "surfaceBorder");
  const textColor = useThemeColor({}, "text");
  const faintText = useThemeColor({}, "textFaint");
  const primaryColor = useThemeColor({}, "primary");
  const mutedText = useThemeColor({}, "textMuted");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEditEntry = (entry: WeightHistoryEntry) => {
    swipeableRefs.current.get(entry.id)?.close();
    router.navigate({
      pathname: "/weight-entry",
      params: {
        exerciseId,
        entryId: entry.id,
        weight: entry.weight.toString(),
        weightUnit: entry.weightUnit,
        note: entry.note ?? "",
        date: entry.date,
      },
    });
  };

  const handleDeleteEntry = (entryId: string) => {
    showConfirm({
      title: "Eliminar registro",
      message: "¿Seguro que quieres eliminar esta entrada del historial?",
      confirmText: "Eliminar",
      destructive: true,
      onCancel: () => swipeableRefs.current.get(entryId)?.close(),
      onConfirm: () => {
        swipeableRefs.current.get(entryId)?.close();
        setDeletingId(entryId);
      },
    });
  };

  const showHistoryRowActionSheet = (entry: WeightHistoryEntry) => {
    showOptions(
      "Registro de peso",
      `${entry.weight} ${entry.weightUnit} · ${new Date(entry.date).toLocaleDateString()}`,
      [
        {
          text: "Editar",
          onPress: () => handleEditEntry(entry),
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => handleDeleteEntry(entry.id),
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
    );
  };

  return (
    <AnimatedHistoryRow
      isDeleting={deletingId === entry.id}
      onRemoveComplete={() => {
        onRemove(entry.id);
        setDeletingId(null);
      }}
    >
      <View style={[styles.historyRowWrapper, { borderColor }]}>
        <ReanimatedSwipeable
          ref={(el) => {
            if (el) swipeableRefs.current.set(entry.id, el);
            else swipeableRefs.current.delete(entry.id);
          }}
          friction={1}
          rightThreshold={40}
          overshootRight={false}
          animationOptions={{
            mass: 1,
            stiffness: 250,
            damping: 28,
            overshootClamping: true,
          }}
          onSwipeableWillOpen={() => {
            const openId = openRowIdRef.current;
            if (openId && openId !== entry.id) {
              swipeableRefs.current.get(openId)?.close();
            }
            openRowIdRef.current = entry.id;
          }}
          onSwipeableClose={() => {
            if (openRowIdRef.current === entry.id) {
              openRowIdRef.current = null;
            }
          }}
          renderRightActions={(_, drag) => (
            <SwipeRightActions
              drag={drag}
              primaryColor={primaryColor}
              onEdit={() => handleEditEntry(entry)}
              onDelete={() => handleDeleteEntry(entry.id)}
            />
          )}
        >
          <Pressable
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showHistoryRowActionSheet(entry);
            }}
            delayLongPress={400}
            accessible
            accessibilityLabel={`${entry.weight} ${entry.weightUnit}, ${new Date(entry.date).toLocaleDateString()}${entry.note ? `, ${entry.note}` : ""}`}
            accessibilityHint="Mantén presionado para editar o eliminar este registro"
            accessibilityActions={[
              { name: "edit", label: "Editar" },
              { name: "delete", label: "Eliminar" },
            ]}
            onAccessibilityAction={(event) => {
              switch (event.nativeEvent.actionName) {
                case "edit":
                  handleEditEntry(entry);
                  break;
                case "delete":
                  handleDeleteEntry(entry.id);
                  break;
              }
            }}
            style={[styles.historyRow, { backgroundColor }]}
          >
            <View style={styles.historyRowTop}>
              <Text style={[styles.historyWeight, { color: textColor }]}>
                {entry.weight} {entry.weightUnit}
              </Text>
              <Text style={[styles.historyDate, { color: faintText }]}>
                {new Date(entry.date).toLocaleDateString()}
              </Text>
            </View>
            {entry.note ? (
              <Text style={[styles.historyNote, { color: mutedText }]}>
                {entry.note}
              </Text>
            ) : null}
          </Pressable>
        </ReanimatedSwipeable>
      </View>
    </AnimatedHistoryRow>
  );
};

const styles = StyleSheet.create({
  historyNote: {
    fontFamily: Fonts.medium,
    fontSize: 13.5,
    lineHeight: 19,
  },
  historyDate: {
    fontFamily: Fonts.semibold,
    fontSize: 12.5,
  },
  historyRowWrapper: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  historyRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyWeight: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  historyRow: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 4,
    minHeight: 56,
    justifyContent: "center",
  },
  swipeActionText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 12,
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
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.25)",
  },
});
export default AnimatedHistoryRowComponent;
