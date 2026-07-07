import { Exercise } from "@/core/categories/interfaces/category.interface";
import { deleteCategory } from "@/core/categories/actions/delete-category.action";
import { createExercise } from "@/core/exercises/actions/create-exercise.action";
import { deleteExercise } from "@/core/exercises/actions/delete-exercise.action";
import { PickedExerciseImage } from "@/core/exercises/interfaces/picked-exercise-image.interface";
import AddNewButton from "@/presentation/common/components/AddNewButton";
import { useCategories } from "@/presentation/categories/hooks/useCategories";
import { usePickExerciseImage } from "@/presentation/exercises/hooks/usePickExerciseImage";
import BottomSheetModal from "@/presentation/theme/components/BottomSheetModal";
import { Fonts } from "@/presentation/theme/fonts";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedTextInput from "@/presentation/theme/components/ThemedTextInput";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from "react-native";

const WEIGHT_UNITS = ["kg", "lb"];

const CategoryScreen = () => {
  const { id, data, name } = useLocalSearchParams<{
    id: string;
    name?: string;
    data?: string;
  }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { categoriesQuery } = useCategories();

  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "surfaceBorder");
  const primaryColor = useThemeColor({}, "primary");
  const primarySoft = useThemeColor({}, "primarySoft");
  const mutedText = useThemeColor({}, "textMuted");
  const faintText = useThemeColor({}, "textFaint");
  const textColor = useThemeColor({}, "text");
  const dangerBg = useThemeColor({}, "dangerBg");
  const dangerBorder = useThemeColor({}, "dangerBorder");
  const dangerText = useThemeColor({}, "danger");

  const initialExercises = useMemo<Exercise[]>(() => {
    if (!data) return [];

    try {
      const parsedData = JSON.parse(data);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch {
      return [];
    }
  }, [data]);
  const exercises = useMemo<Exercise[]>(() => {
    const fromQuery = categoriesQuery.data?.find(
      (category) => category.id === id
    )?.exercise;
    return fromQuery ?? initialExercises;
  }, [categoriesQuery.data, id, initialExercises]);
  const hasExercises = exercises.length > 0;
  const [modalVisible, setModalVisible] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseWeight, setExerciseWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [selectedImage, setSelectedImage] = useState<PickedExerciseImage | null>(
    null
  );
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const { pickImage } = usePickExerciseImage();

  useEffect(() => {
    setImagePreviewFailed(false);
  }, [selectedImage]);

  useEffect(() => {
    const imageUrls = exercises
      .map((exercise) => exercise.imageUrl)
      .filter((url): url is string => !!url);
    if (imageUrls.length > 0) {
      Image.prefetch(imageUrls);
    }
  }, [exercises]);

  const getExerciseWeightLabel = (exercise: Exercise) => {
    if (exercise.weight !== undefined) {
      return `${exercise.weight} ${exercise.weightUnit ?? "kg"}`;
    }

    if (exercise.weightGrams !== undefined) {
      return `${exercise.weightGrams / 1000} kg`;
    }

    return "0 kg";
  };

  const exerciseMutation = useMutation({
    mutationFn: createExercise,
    onSuccess(data) {
      if (data.imageUrl) {
        Image.prefetch(data.imageUrl);
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setExerciseName("");
      setExerciseWeight("");
      setWeightUnit("kg");
      setSelectedImage(null);
      setModalVisible(false);
      Alert.alert("Ejercicio guardado", `${data.name} se creo correctamente`);
    },
    onError(error) {
      Alert.alert("Error", error.message);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      router.replace("/(mgp-app)/(home)");
      Alert.alert(
        "Categoria eliminada",
        `${String(name ?? "La categoria")} se elimino correctamente`
      );
    },
    onError(error) {
      Alert.alert("Error", error.message);
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: deleteExercise,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError(error) {
      Alert.alert("Error", error.message);
    },
  });

  const confirmDeleteExercise = useCallback(
    (exercise: Exercise) => {
      Alert.alert(
        "Eliminar ejercicio",
        `Se eliminara ${exercise.name} y ya no aparecera en tu lista.`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              if (exercise.id) {
                deleteExerciseMutation.mutate(exercise.id);
              }
            },
          },
        ]
      );
    },
    [deleteExerciseMutation]
  );

  const confirmDeleteCategory = useCallback(() => {
    Alert.alert(
      "Eliminar categoria",
      `Se eliminara ${String(name ?? "esta categoria")} y ya no aparecera en tu lista.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: deleteCategoryMutation.isPending ? "Eliminando..." : "Eliminar",
          style: "destructive",
          onPress: () => deleteCategoryMutation.mutate(String(id)),
        },
      ]
    );
  }, [deleteCategoryMutation, id, name]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name ? String(name) : "Ejercicios",
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable
            onPress={confirmDeleteCategory}
            disabled={deleteCategoryMutation.isPending || hasExercises}
            hitSlop={10}
            style={({ pressed }) => [
              styles.deleteHeaderButton,
              {
                opacity: hasExercises
                  ? 0.4
                  : pressed || deleteCategoryMutation.isPending
                  ? 0.75
                  : 1,
              },
            ]}
          >
            <Ionicons name="trash-outline" size={22} color={dangerText} />
          </Pressable>
          <AddNewButton onPressAction={() => setModalVisible(true)} />
        </View>
      ),
    });
  }, [
    confirmDeleteCategory,
    dangerText,
    deleteCategoryMutation.isPending,
    hasExercises,
    name,
    navigation,
  ]);

  const handleCreateExercise = async () => {
    if (!exerciseName.trim()) {
      Alert.alert("Campo requerido", "Ingresa el nombre del ejercicio.");
      return;
    }

    const parsedWeight = Number(exerciseWeight);

    if (Number.isNaN(parsedWeight)) {
      Alert.alert("Campo requerido", "Ingresa un peso valido.");
      return;
    }

    await exerciseMutation.mutateAsync({
      name: exerciseName.trim(),
      weight: parsedWeight,
      weightUnit: weightUnit.trim() || "kg",
      category: String(id),
      image: selectedImage ?? undefined,
    });
  };

  const handlePickImage = async () => {
    const image = await pickImage();
    if (image) {
      setSelectedImage(image);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setExerciseName("");
    setExerciseWeight("");
    setWeightUnit("kg");
    setSelectedImage(null);
  };

  const renderExerciseCard: ListRenderItem<Exercise> = ({ item, index }) => (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        router.push({
          pathname: "/exercise/[id]",
          params: {
            id: item.id ?? `${item.name}-${index}`,
            name: item.name,
            weightGrams: String(item.weightGrams ?? ""),
            weight: String(item.weight ?? ""),
            weightUnit: String(item.weightUnit ?? ""),
            categoryName: String(name ?? "Categoria"),
            imageUrl: String(item.imageUrl ?? ""),
          },
        });
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: surfaceColor,
          borderColor,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={[styles.badge, { backgroundColor, borderColor }]}>
        <Text style={[styles.badgeText, { color: primaryColor }]}>{index + 1}</Text>
      </View>

      <View style={styles.cardInfo}>
        <ThemedText type="defaultSemiBold" style={styles.exerciseName}>
          {item.name}
        </ThemedText>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: faintText }]}>Peso</Text>
          <Text style={[styles.metaValue, { color: textColor }]}>
            {getExerciseWeightLabel(item)}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => confirmDeleteExercise(item)}
        disabled={deleteExerciseMutation.isPending}
        hitSlop={6}
        style={({ pressed }) => [
          styles.rowActionCircle,
          { backgroundColor: dangerBg, opacity: pressed || deleteExerciseMutation.isPending ? 0.6 : 1 },
        ]}
      >
        <Ionicons name="trash-outline" size={15} color={dangerText} />
      </Pressable>

      <View style={[styles.rowActionCircle, { backgroundColor: primarySoft }]}>
        <Ionicons name="chevron-forward" size={16} color={primaryColor} />
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Ejercicios
        </ThemedText>
        <ThemedText style={[styles.description, { color: mutedText }]}>
          Toca una tarjeta para ver los detalles del ejercicio.
        </ThemedText>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item, index) => item.id ?? `${item.name}-${index}`}
        renderItem={renderExerciseCard}
        contentContainerStyle={[
          styles.listContent,
          exercises.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={categoriesQuery.isRefetching}
            onRefresh={() => categoriesQuery.refetch()}
            tintColor={primaryColor}
          />
        }
        ListFooterComponent={
          <View style={[styles.dangerZone, { backgroundColor: dangerBg, borderColor: dangerBorder }]}>
            <View style={styles.dangerZoneHeader}>
              <Ionicons name="warning-outline" size={20} color={dangerText} />
              <Text style={[styles.dangerZoneTitle, { color: dangerText }]}>
                Zona de peligro
              </Text>
            </View>
            <ThemedText style={[styles.dangerZoneDescription, { color: mutedText }]}>
              {hasExercises
                ? "Elimina primero todos los ejercicios de esta categoria para poder eliminarla."
                : "Si ya no necesitas esta categoria, puedes eliminarla desde aqui."}
            </ThemedText>
            <Pressable
              onPress={confirmDeleteCategory}
              disabled={deleteCategoryMutation.isPending || hasExercises}
              style={({ pressed }) => [
                styles.deleteCategoryButton,
                {
                  backgroundColor: dangerText,
                  opacity: hasExercises
                    ? 0.4
                    : pressed || deleteCategoryMutation.isPending
                    ? 0.82
                    : 1,
                },
              ]}
            >
              <Text style={styles.deleteCategoryButtonText}>
                {deleteCategoryMutation.isPending
                  ? "Eliminando categoria..."
                  : "Eliminar categoria"}
              </Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: surfaceColor, borderColor }]}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No hay ejercicios en esta categoria
            </ThemedText>
            <ThemedText style={[styles.emptyDescription, { color: mutedText }]}>
              Cuando agregues ejercicios, apareceran aqui en tarjetas listas
              para abrir sus detalles.
            </ThemedText>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <BottomSheetModal visible={modalVisible} onClose={closeModal}>
        <ThemedText type="subtitle" style={styles.modalTitle}>
          Nuevo ejercicio
        </ThemedText>
        <ThemedText style={[styles.modalDescription, { color: mutedText }]}>
          Agrega el nombre, el peso y la unidad para esta categoria.
        </ThemedText>

        <ThemedTextInput
          placeholder="Nombre del ejercicio"
          value={exerciseName}
          onChangeText={setExerciseName}
          autoCapitalize="words"
          autoFocus
        />

        <View style={styles.weightRow}>
          <ThemedTextInput
            placeholder="Peso"
            value={exerciseWeight}
            onChangeText={setExerciseWeight}
            keyboardType="numeric"
            style={styles.weightInput}
          />

          <View style={[styles.unitToggle, { backgroundColor: borderColor }]}>
            {WEIGHT_UNITS.map((unit) => (
              <Pressable
                key={unit}
                onPress={() => setWeightUnit(unit)}
                style={[
                  styles.unitOption,
                  weightUnit === unit && { backgroundColor: surfaceColor },
                ]}
              >
                <Text
                  style={[
                    styles.unitOptionText,
                    { color: weightUnit === unit ? primaryColor : faintText },
                  ]}
                >
                  {unit}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {selectedImage ? (
          <View style={styles.imagePreviewCard}>
            {imagePreviewFailed ? (
              <View style={[styles.imagePreview, styles.imagePreviewFallback, { borderColor }]}>
                <Ionicons name="image-outline" size={22} color={mutedText} />
              </View>
            ) : (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.imagePreview}
                contentFit="cover"
                onError={() => setImagePreviewFailed(true)}
              />
            )}
            <View style={styles.imagePreviewOverlay}>
              <View style={styles.imageAddedBadge}>
                <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                <Text style={styles.imageAddedText}>Imagen añadida</Text>
              </View>
              <Pressable style={styles.changeImageChip} onPress={handlePickImage}>
                <Ionicons name="camera-outline" size={12} color={primaryColor} />
                <Text style={[styles.changeImageChipText, { color: primaryColor }]}>
                  Cambiar
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={[styles.addImageButton, { borderColor: faintText }]}
            onPress={handlePickImage}
          >
            <Ionicons name="image-outline" size={19} color={primaryColor} />
            <Text style={[styles.addImageButtonText, { color: primaryColor }]}>
              Agregar imagen
            </Text>
          </Pressable>
        )}

        <View style={styles.modalButtonWrapper}>
          <ThemedButton
            onPress={handleCreateExercise}
            disabled={exerciseMutation.isPending}
          >
            {exerciseMutation.isPending ? "Guardando..." : "Guardar ejercicio"}
          </ThemedButton>
        </View>

        <Pressable style={styles.cancelButton} onPress={closeModal}>
          <Text style={[styles.cancelText, { color: mutedText }]}>Cancelar</Text>
        </Pressable>
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 10,
    gap: 5,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.semibold,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deleteHeaderButton: {
    padding: 4,
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 28,
    gap: 11,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
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
  cardInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    letterSpacing: -0.2,
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
  rowActionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptyDescription: {
    textAlign: "center",
    lineHeight: 22,
  },
  dangerZone: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 20,
    marginTop: 8,
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
    lineHeight: 21,
    fontSize: 13.5,
  },
  deleteCategoryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteCategoryButtonText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  modalTitle: {
    marginBottom: 8,
  },
  modalDescription: {
    lineHeight: 21,
    marginBottom: 18,
    fontSize: 14,
  },
  weightRow: {
    flexDirection: "row",
    gap: 11,
  },
  weightInput: {
    flex: 1,
    marginBottom: 0,
  },
  unitToggle: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    height: 54,
    alignItems: "center",
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 11,
  },
  unitOptionText: {
    fontFamily: Fonts.extrabold,
    fontSize: 13,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 11,
  },
  addImageButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  imagePreviewCard: {
    marginTop: 11,
    borderRadius: 16,
    overflow: "hidden",
    height: 130,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePreviewFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  imagePreviewOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(12,13,17,0.5)",
  },
  imageAddedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  imageAddedText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  changeImageChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  changeImageChipText: {
    fontFamily: Fonts.extrabold,
    fontSize: 12,
  },
  modalButtonWrapper: {
    marginTop: 15,
  },
  cancelButton: {
    marginTop: 6,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 4,
  },
  cancelText: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
});

export default CategoryScreen;
