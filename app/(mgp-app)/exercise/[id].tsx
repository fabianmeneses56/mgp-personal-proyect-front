import { deleteExercise } from "@/core/exercises/actions/delete-exercise.action";
import { updateExerciseImage } from "@/core/exercises/actions/update-exercise-image.action";
import { PickedExerciseImage } from "@/core/exercises/interfaces/picked-exercise-image.interface";
import { WeightHistoryEntry } from "@/core/weight-history/interfaces/weight-history.interface";
import FullscreenImageModal from "@/presentation/exercises/components/FullscreenImageModal";
import { usePickExerciseImage } from "@/presentation/exercises/hooks/usePickExerciseImage";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useWeightHistory } from "@/presentation/weight-history/hooks/useWeightHistory";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
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
          height.value = h;
        }
      }}
    >
      {children}
    </Animated.View>
  );
}

const ExerciseDetailScreen = () => {
  const { id, name, weightGrams, weight, weightUnit, categoryName, imageUrl } =
    useLocalSearchParams<{
      id: string;
      name?: string;
      weightGrams?: string;
      weight?: string;
      weightUnit?: string;
      categoryName?: string;
      imageUrl?: string;
    }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "surfaceBorder");
  const textColor = useThemeColor({}, "text");
  const faintText = useThemeColor({}, "textFaint");
  const primaryColor = useThemeColor({}, "primary");
  const primarySoft = useThemeColor({}, "primarySoft");
  const mutedText = useThemeColor({}, "textMuted");
  const dangerBg = useThemeColor({}, "dangerBg");
  const dangerBorder = useThemeColor({}, "dangerBorder");
  const dangerText = useThemeColor({}, "danger");

  const { weightHistory, isLoading, isRefetching, refetch, removeMutation } =
    useWeightHistory(String(id));

  const latestWeightEntry =
    [...weightHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0] ?? null;
  const displayWeight = latestWeightEntry
    ? `${latestWeightEntry.weight} ${latestWeightEntry.weightUnit}`
    : "Sin registros";

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const swipeableRefs = useRef<Map<string, { close: () => void }>>(new Map());
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(
    imageUrl || undefined,
  );
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const { pickImage } = usePickExerciseImage();

  useEffect(() => {
    setImageLoadFailed(false);
  }, [currentImageUrl]);

  const handleEditEntry = (entry: WeightHistoryEntry) => {
    swipeableRefs.current.get(entry.id)?.close();
    router.navigate({
      pathname: "/weight-entry",
      params: {
        exerciseId: String(id),
        entryId: entry.id,
        weight: entry.weight.toString(),
        weightUnit: entry.weightUnit,
        note: entry.note ?? "",
        date: entry.date,
      },
    });
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert(
      "Eliminar registro",
      "¿Seguro que quieres eliminar esta entrada del historial?",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => swipeableRefs.current.get(entryId)?.close(),
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            swipeableRefs.current.get(entryId)?.close();
            setDeletingId(entryId);
          },
        },
      ],
    );
  };

  const openCreateWeightModal = () => {
    router.navigate({
      pathname: "/weight-entry",
      params: {
        exerciseId: String(id),
        ...(latestWeightEntry && {
          weight: latestWeightEntry.weight.toString(),
          weightUnit: latestWeightEntry.weightUnit,
        }),
      },
    });
  };

  const deleteExerciseMutation = useMutation({
    mutationFn: deleteExercise,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      router.back();
      Alert.alert(
        "Ejercicio eliminado",
        `${String(name ?? "El ejercicio")} se elimino correctamente`,
      );
    },
    onError(error) {
      Alert.alert("Error", error.message);
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: ({
      exerciseId,
      image,
    }: {
      exerciseId: string;
      image: PickedExerciseImage;
    }) => updateExerciseImage(exerciseId, image),
    onSuccess(data) {
      if (data.imageUrl) {
        Image.prefetch(data.imageUrl);
      }
      setCurrentImageUrl(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError(error) {
      Alert.alert("Error", error.message);
    },
  });

  const handleChangeImage = async () => {
    const image = await pickImage();
    if (image) {
      updateImageMutation.mutate({ exerciseId: String(id), image });
    }
  };

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
      ],
    );
  }, [deleteExerciseMutation, id, name]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name ? String(name) : undefined,
      headerRight: () => (
        <Pressable
          onPress={confirmDeleteExercise}
          disabled={deleteExerciseMutation.isPending}
          hitSlop={10}
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
    <ScrollView
      style={[styles.scrollView, { backgroundColor }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={primaryColor}
        />
      }
    >
      <View
        style={[
          styles.heroCard,
          { backgroundColor: surfaceColor, borderColor },
        ]}
      >
        <View style={[styles.heroBadge, { backgroundColor: primarySoft }]}>
          <Text style={[styles.heroBadgeText, { color: primaryColor }]}>
            Detalle
          </Text>
        </View>

        {currentImageUrl && !imageLoadFailed ? (
          <Pressable
            onPress={() => setImageViewerVisible(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Image
              source={{ uri: currentImageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
              onError={() => setImageLoadFailed(true)}
            />
          </Pressable>
        ) : (
          <View
            style={[styles.heroImagePlaceholder, { borderColor: faintText }]}
          >
            <Text
              style={[styles.heroImagePlaceholderText, { color: faintText }]}
            >
              IMAGEN DEL EJERCICIO
            </Text>
          </View>
        )}

        <View style={styles.changeImageWrapper}>
          <Pressable
            onPress={handleChangeImage}
            disabled={updateImageMutation.isPending}
            style={({ pressed }) => [
              styles.changeImageButton,
              {
                backgroundColor: primarySoft,
                opacity: pressed || updateImageMutation.isPending ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="camera-outline" size={16} color={primaryColor} />
            <Text
              style={[styles.changeImageButtonText, { color: primaryColor }]}
            >
              {updateImageMutation.isPending
                ? "Actualizando..."
                : "Cambiar imagen"}
            </Text>
          </Pressable>
        </View>

        <ThemedText type="title" style={styles.title}>
          {name ?? "Ejercicio"}
        </ThemedText>

        <Text style={[styles.subtitle, { color: mutedText }]}>
          Categoria: {categoryName ?? "Sin categoria"}
        </Text>
      </View>

      <View
        style={[
          styles.metricCard,
          { backgroundColor: surfaceColor, borderColor },
        ]}
      >
        <Text style={[styles.metricLabel, { color: faintText }]}>
          Peso asignado
        </Text>
        <Text style={[styles.metricValue, { color: primaryColor }]}>
          {displayWeight}
        </Text>
        <Text style={[styles.metricHint, { color: mutedText }]}>
          Usa este valor para identificar rapidamente la carga del ejercicio.
        </Text>
      </View>

      <View
        style={[
          styles.historyCard,
          { backgroundColor: surfaceColor, borderColor },
        ]}
      >
        <ThemedText type="subtitle" style={styles.historyTitle}>
          Historico de pesos
        </ThemedText>

        {isLoading ? (
          [0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.historyRowWrapper,
                {
                  borderColor,
                  backgroundColor: borderColor,
                  height: 56,
                  borderRadius: 14,
                },
              ]}
            />
          ))
        ) : weightHistory.length === 0 ? (
          <Text style={[styles.emptyHistory, { color: faintText }]}>
            Sin registros de peso
          </Text>
        ) : null}

        {!isLoading &&
          [...weightHistory]
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .map((entry) => (
              <AnimatedHistoryRow
                key={entry.id}
                isDeleting={deletingId === entry.id}
                onRemoveComplete={() => {
                  removeMutation.mutate({ entryId: entry.id });
                  setDeletingId(null);
                }}
              >
                <View style={[styles.historyRowWrapper, { borderColor }]}>
                  <ReanimatedSwipeable
                    ref={(el) => {
                      if (el) swipeableRefs.current.set(entry.id, el);
                      else swipeableRefs.current.delete(entry.id);
                    }}
                    friction={2}
                    overshootRight={false}
                    renderRightActions={(_, drag) => (
                      <SwipeRightActions
                        drag={drag}
                        primaryColor={primaryColor}
                        onEdit={() => handleEditEntry(entry)}
                        onDelete={() => handleDeleteEntry(entry.id)}
                      />
                    )}
                  >
                    <View style={[styles.historyRow, { backgroundColor }]}>
                      <View style={styles.historyRowTop}>
                        <Text
                          style={[styles.historyWeight, { color: textColor }]}
                        >
                          {entry.weight} {entry.weightUnit}
                        </Text>
                        <Text
                          style={[styles.historyDate, { color: faintText }]}
                        >
                          {new Date(entry.date).toLocaleDateString()}
                        </Text>
                      </View>
                      {entry.note ? (
                        <Text
                          style={[styles.historyNote, { color: mutedText }]}
                        >
                          {entry.note}
                        </Text>
                      ) : null}
                    </View>
                  </ReanimatedSwipeable>
                </View>
              </AnimatedHistoryRow>
            ))}

        <Pressable
          onPress={openCreateWeightModal}
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

      <View
        style={[
          styles.dangerZone,
          { backgroundColor: dangerBg, borderColor: dangerBorder },
        ]}
      >
        <View style={styles.dangerZoneHeader}>
          <Ionicons name="warning-outline" size={20} color={dangerText} />
          <Text style={[styles.dangerZoneTitle, { color: dangerText }]}>
            Zona de peligro
          </Text>
        </View>
        <Text style={[styles.dangerZoneDescription, { color: mutedText }]}>
          Si ya no necesitas este ejercicio, puedes eliminarlo desde aqui.
        </Text>
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

      {currentImageUrl ? (
        <FullscreenImageModal
          visible={imageViewerVisible}
          imageUrl={currentImageUrl}
          onClose={() => setImageViewerVisible(false)}
        />
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  deleteHeaderButton: {
    padding: 4,
    transform: [{ translateX: 3 }],
  },
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 20,
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginBottom: 15,
  },
  heroBadgeText: {
    fontFamily: Fonts.extrabold,
    fontSize: 11.5,
    letterSpacing: 0.3,
  },
  heroImage: {
    width: "100%",
    height: 165,
    borderRadius: 18,
  },
  heroImagePlaceholder: {
    width: "100%",
    height: 165,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImagePlaceholderText: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  changeImageWrapper: {
    marginTop: 15,
    alignItems: "center",
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 17,
    paddingVertical: 10,
  },
  changeImageButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
  },
  title: {
    marginTop: 17,
    fontSize: 25,
    lineHeight: 29,
  },
  subtitle: {
    marginTop: 3,
    fontFamily: Fonts.semibold,
    fontSize: 13.5,
  },
  metricCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 19,
    gap: 6,
  },
  metricLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metricValue: {
    fontWeight: "800",
    fontSize: 30,
    fontVariant: ["tabular-nums"],
  },
  metricHint: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.medium,
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
  emptyHistory: {
    fontSize: 13.5,
    fontFamily: Fonts.semibold,
    textAlign: "center",
    paddingVertical: 8,
  },
  historyRowWrapper: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  historyRow: {
    paddingVertical: 13,
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
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  historyDate: {
    fontFamily: Fonts.semibold,
    fontSize: 12.5,
  },
  historyNote: {
    fontFamily: Fonts.medium,
    fontSize: 13.5,
    lineHeight: 19,
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
  swipeActionText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
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
  dangerZone: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 19,
    gap: 12,
  },
  dangerZoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dangerZoneTitle: {
    fontFamily: Fonts.extrabold,
    fontSize: 16,
  },
  dangerZoneDescription: {
    fontFamily: Fonts.medium,
    lineHeight: 21,
    fontSize: 13.5,
  },
  deleteExerciseButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteExerciseButtonText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
});

export default ExerciseDetailScreen;
