import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useCategories } from "@/presentation/categories/hooks/useCategories";
import EmptyState from "@/presentation/common/components/EmptyState";
import ErrorState from "@/presentation/common/components/ErrorState";
import { Fonts } from "@/presentation/theme/fonts";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";
import { router } from "expo-router";

const HomeScreen = () => {
  const { categoriesQuery } = useCategories();

  const colors = useThemeColors();

  if (categoriesQuery.isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            styles.loadingCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <ActivityIndicator size={32} color={colors.primary} />
          <ThemedText type="subtitle" style={styles.loadingTitle}>
            Cargando categorias
          </ThemedText>
          <ThemedText style={[styles.loadingText, { color: colors.textMuted }]}>
            Estamos preparando tu espacio de entrenamiento.
          </ThemedText>
        </View>
      </View>
    );
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={categories}
        keyExtractor={(category) => category.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={categoriesQuery.isRefetching}
            onRefresh={() => categoriesQuery.refetch()}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.heroBadge,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Text style={[styles.heroBadgeText, { color: colors.primary }]}>
                  Rutina
                </Text>
              </View>

              <ThemedText type="title" style={styles.heroTitle}>
                Tus categorias
              </ThemedText>

              <ThemedText
                style={[styles.heroDescription, { color: colors.textMuted }]}
              >
                Organiza tus ejercicios por grupo y entra rapido a cada
                categoria.
              </ThemedText>

              <View style={styles.statsRow}>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.statLabel, { color: colors.textFaint }]}>
                    Categorias
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {categories.length}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.statLabel, { color: colors.textFaint }]}>
                    Ejercicios
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {categories.reduce(
                      (total, category) => total + category.exercise.length,
                      0,
                    )}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Explora categorias</ThemedText>
              <ThemedText
                style={[styles.sectionHint, { color: colors.textFaint }]}
              >
                Toca una tarjeta para ver sus ejercicios.
              </ThemedText>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            testID={`category-row-${item.name}`}
            onPress={() => {
              Haptics.selectionAsync();
              router.push({
                pathname: "/category/[id]",
                params: {
                  id: item.id,
                  name: item.name,
                  data: JSON.stringify(item.exercise),
                },
              });
            }}
            style={({ pressed }) => [
              styles.categoryCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.indexBadge,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.indexBadgeText, { color: colors.primary }]}>
                {index + 1}
              </Text>
            </View>

            <View style={styles.categoryInfo}>
              <ThemedText
                type="defaultSemiBold"
                style={styles.categoryName}
                numberOfLines={1}
              >
                {item.name}
              </ThemedText>
              <Text style={[styles.categoryMeta, { color: colors.textFaint }]}>
                {item.exercise.length}{" "}
                {item.exercise.length === 1 ? "ejercicio" : "ejercicios"}
              </Text>
            </View>

            <View
              style={[
                styles.chevronCircle,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textFaint}
              />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          categoriesQuery.isError ? (
            <ErrorState
              message="No pudimos cargar tus categorias."
              onRetry={() => categoriesQuery.refetch()}
              style={styles.emptyStateSpacing}
            />
          ) : (
            <EmptyState
              title="Aun no hay categorias"
              description="Crea tu primera categoria con el boton superior para empezar a organizar tus ejercicios."
              style={styles.emptyStateSpacing}
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 26,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  loadingTitle: {
    marginTop: 6,
  },
  loadingText: {
    textAlign: "center",
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 28,
    gap: 11,
  },
  headerBlock: {
    gap: 20,
    marginBottom: 4,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 24,
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 16,
  },
  heroBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 32,
    marginBottom: 9,
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
    maxWidth: 280,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
  },
  statLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10.5,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  sectionHeader: {
    gap: 3,
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.semibold,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
  },
  indexBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  indexBadgeText: {
    fontWeight: "800",
    fontSize: 15,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    letterSpacing: -0.2,
  },
  categoryMeta: {
    marginTop: 3,
    fontSize: 12.5,
    fontFamily: Fonts.semibold,
  },
  chevronCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateSpacing: {
    marginTop: 18,
  },
});

export default HomeScreen;
