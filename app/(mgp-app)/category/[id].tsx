import { deleteCategory } from "@/core/categories/actions/delete-category.action";
import { Exercise } from "@/core/categories/interfaces/category.interface";
import RenderExerciseCard from "@/presentation/categories/components/RenderExerciseCard";
import { useCategories } from "@/presentation/categories/hooks/useCategories";
import AddNewButton from "@/presentation/common/components/AddNewButton";
import { useDeleteExercise } from "@/presentation/exercises/hooks/useDeleteExercise";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showAlert, showConfirm } from "@/helpers/alerts/alert.service";

const CategoryScreen = () => {
  const { id, data, name } = useLocalSearchParams<{
    id: string;
    name?: string;
    data?: string;
  }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { categoriesQuery } = useCategories();
  const { remove: removeExercise, isDeleting: isDeletingExercise } =
    useDeleteExercise();

  const colors = useThemeColors();

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
      (category) => category.id === id,
    )?.exercise;
    return fromQuery ?? initialExercises;
  }, [categoriesQuery.data, id, initialExercises]);
  const hasExercises = exercises.length > 0;

  useEffect(() => {
    const imageUrls = exercises
      .map((exercise) => exercise.imageUrl)
      .filter((url): url is string => !!url);
    if (imageUrls.length > 0) {
      Image.prefetch(imageUrls);
    }
  }, [exercises]);

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      router.replace("/(mgp-app)/(home)");
      showAlert(
        "Categoria eliminada",
        `${String(name ?? "La categoria")} se elimino correctamente`,
      );
    },
    onError(error) {
      showAlert("Error", error.message);
    },
  });

  const confirmDeleteCategory = useCallback(() => {
    showConfirm({
      title: "Eliminar categoria",
      message: `Se eliminara ${String(name ?? "esta categoria")} y ya no aparecera en tu lista.`,
      confirmText: deleteCategoryMutation.isPending
        ? "Eliminando..."
        : "Eliminar",
      destructive: true,
      onConfirm: () => deleteCategoryMutation.mutate(String(id)),
    });
  }, [deleteCategoryMutation, id, name]);

  const confirmDeleteExercise = useCallback(
    (exercise: Exercise) => {
      showConfirm({
        title: "Eliminar ejercicio",
        message: `Se eliminara ${exercise.name} y ya no aparecera en tu lista.`,
        confirmText: "Eliminar",
        destructive: true,
        onConfirm: () => {
          if (exercise.id) {
            removeExercise(exercise.id);
          }
        },
      });
    },
    [removeExercise],
  );

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
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </Pressable>
          <AddNewButton
            testID="category-new-exercise-button"
            onPressAction={() =>
              router.navigate({
                pathname: "/new-exercise",
                params: { categoryId: String(id) },
              })
            }
          />
        </View>
      ),
    });
  }, [
    id,
    confirmDeleteCategory,
    colors.danger,
    deleteCategoryMutation.isPending,
    hasExercises,
    name,
    navigation,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Ejercicios
        </ThemedText>
        <ThemedText style={[styles.description, { color: colors.textMuted }]}>
          Toca una tarjeta para ver los detalles del ejercicio.
        </ThemedText>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item, index) => item.id ?? `${item.name}-${index}`}
        renderItem={({ item, index }) => (
          <RenderExerciseCard
            item={item}
            index={index}
            categoryName={String(name ?? "Categoria")}
            onDelete={confirmDeleteExercise}
            isDeleting={isDeletingExercise}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          exercises.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={categoriesQuery.isRefetching}
            onRefresh={() => categoriesQuery.refetch()}
            tintColor={colors.primary}
          />
        }
        ListFooterComponent={
          <View
            style={[
              styles.dangerZone,
              {
                backgroundColor: colors.dangerBg,
                borderColor: colors.dangerBorder,
              },
            ]}
          >
            <View style={styles.dangerZoneHeader}>
              <Ionicons
                name="warning-outline"
                size={20}
                color={colors.danger}
              />
              <Text style={[styles.dangerZoneTitle, { color: colors.danger }]}>
                Zona de peligro
              </Text>
            </View>
            <ThemedText
              style={[
                styles.dangerZoneDescription,
                { color: colors.textMuted },
              ]}
            >
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
                  backgroundColor: colors.danger,
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
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No hay ejercicios en esta categoria
            </ThemedText>
            <ThemedText
              style={[styles.emptyDescription, { color: colors.textMuted }]}
            >
              Cuando agregues ejercicios, apareceran aqui en tarjetas listas
              para abrir sus detalles.
            </ThemedText>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
});

export default CategoryScreen;
