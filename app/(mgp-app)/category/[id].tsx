import { deleteCategory } from "@/core/categories/actions/delete-category.action";
import { Exercise } from "@/core/categories/interfaces/category.interface";
import RenderExerciseCard from "@/presentation/categories/components/RenderExerciseCard";
import { useCategories } from "@/presentation/categories/hooks/useCategories";
import AddNewButton from "@/presentation/common/components/AddNewButton";
import { useDeleteExercise } from "@/presentation/exercises/hooks/useDeleteExercise";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
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

  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "surfaceBorder");
  const primaryColor = useThemeColor({}, "primary");
  const mutedText = useThemeColor({}, "textMuted");
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
      confirmText: deleteCategoryMutation.isPending ? "Eliminando..." : "Eliminar",
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
            <Ionicons name="trash-outline" size={22} color={dangerText} />
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
    dangerText,
    deleteCategoryMutation.isPending,
    hasExercises,
    name,
    navigation,
  ]);

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
            tintColor={primaryColor}
          />
        }
        ListFooterComponent={
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
            <ThemedText
              style={[styles.dangerZoneDescription, { color: mutedText }]}
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
          <View
            style={[
              styles.emptyState,
              { backgroundColor: surfaceColor, borderColor },
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
