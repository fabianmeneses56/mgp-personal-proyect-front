import { Exercise } from "@/core/categories/interfaces/category.interface";
import { deleteCategory } from "@/core/categories/actions/delete-category.action";
import { createExercise } from "@/core/exercises/actions/create-exercise.action";
import { deleteExercise } from "@/core/exercises/actions/delete-exercise.action";
import { PickedExerciseImage } from "@/core/exercises/interfaces/picked-exercise-image.interface";
import { Colors } from "@/constants/theme";
import AddNewButton from "@/presentation/common/components/AddNewButton";
import { useCategories } from "@/presentation/categories/hooks/useCategories";
import { usePickExerciseImage } from "@/presentation/exercises/hooks/usePickExerciseImage";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedTextInput from "@/presentation/theme/components/ThemedTextInput";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from "react-native";

const CategoryScreen = () => {
  const { id, data, name } = useLocalSearchParams<{
    id: string;
    name?: string;
    data?: string;
  }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { categoriesQuery } = useCategories();
  const cardBackground = useThemeColor(
    { light: "#F7F8FC", dark: "#20242C" },
    "background"
  );
  const accentBackground = useThemeColor(
    { light: "#E8EEFF", dark: "#283552" },
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
  const modalBackground = useThemeColor(
    { light: "#FFFFFF", dark: "#151718" },
    "background"
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
            disabled={deleteCategoryMutation.isPending}
            style={({ pressed }) => [
              styles.deleteHeaderButton,
              { opacity: pressed || deleteCategoryMutation.isPending ? 0.75 : 1 },
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
    deleteCategoryMutation.isPending,
    dangerText,
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
      onPress={() =>
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
        })
      }
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardBackground,
          borderColor,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.badge,
            { backgroundColor: accentBackground, borderColor: Colors.light.primary },
          ]}
        >
          <ThemedText style={styles.badgeText}>{`${index + 1}`}</ThemedText>
        </View>

        <View style={styles.cardHeaderActions}>
          <Pressable
            onPress={() => confirmDeleteExercise(item)}
            disabled={deleteExerciseMutation.isPending}
            style={({ pressed }) => [
              styles.deleteExerciseIconButton,
              { opacity: pressed || deleteExerciseMutation.isPending ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={dangerText} />
          </Pressable>

          <View style={styles.chevronContainer}>
            <ThemedText style={[styles.chevron, { color: Colors.light.primary }]}>
              ›
            </ThemedText>
          </View>
        </View>
      </View>

      <ThemedText type="subtitle" style={styles.exerciseName}>
        {item.name}
      </ThemedText>

      <View style={styles.metaRow}>
        <ThemedText style={[styles.metaLabel, { color: mutedText }]}>
          Peso
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.metaValue}>
          {getExerciseWeightLabel(item)}
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
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
        ListFooterComponent={
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
              Si ya no necesitas esta categoria, puedes eliminarla desde aqui.
            </ThemedText>
            <Pressable
              onPress={confirmDeleteCategory}
              disabled={deleteCategoryMutation.isPending}
              style={({ pressed }) => [
                styles.deleteCategoryButton,
                {
                  backgroundColor: dangerText,
                  opacity:
                    pressed || deleteCategoryMutation.isPending ? 0.82 : 1,
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
          <View
            style={[
              styles.emptyState,
              { backgroundColor: cardBackground, borderColor },
            ]}
          >
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

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: modalBackground, borderColor },
            ]}
          >
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
            />

            <ThemedTextInput
              placeholder="Peso"
              value={exerciseWeight}
              onChangeText={setExerciseWeight}
              keyboardType="numeric"
            />

            <ThemedTextInput
              placeholder="Unidad de peso"
              value={weightUnit}
              onChangeText={setWeightUnit}
              autoCapitalize="none"
            />

            {selectedImage ? (
              <View style={styles.imagePreviewRow}>
                {imagePreviewFailed ? (
                  <View style={[styles.imagePreview, styles.imagePreviewFallback, { borderColor }]}>
                    <Ionicons name="image-outline" size={20} color={mutedText} />
                  </View>
                ) : (
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={[styles.imagePreview, { borderColor }]}
                    contentFit="cover"
                    onError={() => setImagePreviewFailed(true)}
                  />
                )}
                <Pressable
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={[styles.cancelButtonText, { color: mutedText }]}>
                    Quitar
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.addImageButton, { borderColor }]}
                onPress={handlePickImage}
              >
                <Ionicons name="image-outline" size={18} color={mutedText} />
                <Text style={[styles.addImageButtonText, { color: mutedText }]}>
                  Agregar imagen
                </Text>
              </Pressable>
            )}

            <ThemedButton
              onPress={handleCreateExercise}
              disabled={exerciseMutation.isPending}
            >
              {exerciseMutation.isPending ? "Guardando..." : "Guardar ejercicio"}
            </ThemedButton>

            <Pressable style={styles.cancelButton} onPress={closeModal}>
              <Text style={[styles.cancelButtonText, { color: mutedText }]}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 12,
    gap: 6,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
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
    paddingTop: 8,
    paddingBottom: 28,
    gap: 14,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  badge: {
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  cardHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteExerciseIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(180, 35, 24, 0.08)",
  },
  chevronContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(61, 100, 244, 0.08)",
  },
  chevron: {
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
  },
  exerciseName: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 18,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 18,
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 28,
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
    borderRadius: 28,
    padding: 20,
    marginTop: 18,
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
  deleteCategoryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteCategoryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
  },
  modalTitle: {
    marginBottom: 6,
  },
  modalDescription: {
    lineHeight: 22,
    marginBottom: 18,
  },
  cancelButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  addImageButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  imagePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  imagePreview: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
  },
  imagePreviewFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
  },
  removeImageButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});

export default CategoryScreen;
