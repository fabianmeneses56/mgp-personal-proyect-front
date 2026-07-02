import { deleteExercise } from "@/core/exercises/actions/delete-exercise.action";
import { updateExerciseImage } from "@/core/exercises/actions/update-exercise-image.action";
import { PickedExerciseImage } from "@/core/exercises/interfaces/picked-exercise-image.interface";
import { Colors } from "@/constants/theme";
import FullscreenImageModal from "@/presentation/exercises/components/FullscreenImageModal";
import RegisterWeightModal from "@/presentation/exercises/components/RegisterWeightModal";
import { usePickExerciseImage } from "@/presentation/exercises/hooks/usePickExerciseImage";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useWeightHistory } from "@/presentation/weight-history/hooks/useWeightHistory";
import { WeightHistoryEntry } from "@/core/weight-history/interfaces/weight-history.interface";
import { Ionicons } from "@expo/vector-icons";
import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { Extrapolation, interpolate, runOnJS, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from "react-native";

const SWIPE_ACTIONS_WIDTH = 136;

function SwipeRightActions({
  drag,
  onEdit,
  onDelete,
}: {
  drag: SharedValue<number>;
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
          Extrapolation.CLAMP
        ),
      },
    ],
  }));
  return (
    <Animated.View style={[styles.swipeActions, animatedStyle]}>
      <Pressable
        onPress={onEdit}
        style={[styles.swipeActionEdit, { backgroundColor: Colors.light.primary }]}
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

  const { weightHistory, isLoading, createMutation, updateMutation, removeMutation } =
    useWeightHistory(String(id));

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const swipeableRefs = useRef<Map<string, { close: () => void }>>(new Map());
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(
    imageUrl || undefined
  );
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const { pickImage } = usePickExerciseImage();

  useEffect(() => {
    setImageLoadFailed(false);
  }, [currentImageUrl]);

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
    swipeableRefs.current.get(entry.id)?.close();
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

    const payload = {
      weight: parsedWeight,
      weightUnit: formWeightUnit,
      note: formNote.trim() ? formNote.trim() : undefined,
      date: formDate.toISOString(),
    };

    if (editingEntryId) {
      updateMutation.mutate({ entryId: editingEntryId, payload });
    } else {
      createMutation.mutate(payload);
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

  const updateImageMutation = useMutation({
    mutationFn: ({ exerciseId, image }: { exerciseId: string; image: PickedExerciseImage }) =>
      updateExerciseImage(exerciseId, image),
    onSuccess(data) {
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

        {currentImageUrl && !imageLoadFailed ? (
          <Pressable
            onPress={() => setImageViewerVisible(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Image
              source={{ uri: currentImageUrl }}
              style={[styles.heroImage, { borderColor }]}
              contentFit="cover"
              onError={() => setImageLoadFailed(true)}
            />
          </Pressable>
        ) : (
          <View style={[styles.heroImagePlaceholder, { borderColor }]}>
            <Ionicons name="image-outline" size={36} color={mutedText} />
          </View>
        )}

        <Pressable
          onPress={handleChangeImage}
          disabled={updateImageMutation.isPending}
          style={({ pressed }) => [
            styles.changeImageButton,
            { borderColor, opacity: pressed || updateImageMutation.isPending ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="camera-outline" size={16} color={Colors.light.primary} />
          <Text style={[styles.changeImageButtonText, { color: Colors.light.primary }]}>
            {updateImageMutation.isPending ? "Actualizando..." : "Cambiar imagen"}
          </Text>
        </Pressable>

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

        {isLoading ? (
          [0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.historyRowWrapper,
                { borderColor, backgroundColor: borderColor, height: 56, borderRadius: 14 },
              ]}
            />
          ))
        ) : weightHistory.length === 0 ? (
          <ThemedText style={[styles.emptyHistory, { color: mutedText }]}>
            Sin registros de peso
          </ThemedText>
        ) : null}

        {!isLoading && [...weightHistory]
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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
                      onEdit={() => handleEditEntry(entry)}
                      onDelete={() => handleDeleteEntry(entry.id)}
                    />
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
            </AnimatedHistoryRow>
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
  heroImage: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  heroImagePlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  changeImageButtonText: {
    fontSize: 14,
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
