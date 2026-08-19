import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ActivityRow from "@/presentation/activity/components/ActivityRow";
import { useActivity } from "@/presentation/activity/hooks/useActivity";
import { groupActivityByDay } from "@/presentation/activity/utils/group-activity-by-day";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";

const ActivityScreen = () => {
  const { activityQuery } = useActivity();

  const colors = useThemeColors();

  if (activityQuery.isLoading) {
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
            Cargando actividad
          </ThemedText>
          <ThemedText style={[styles.loadingText, { color: colors.textMuted }]}>
            Estamos trayendo tus últimos movimientos.
          </ThemedText>
        </View>
      </View>
    );
  }

  const sections = groupActivityByDay(activityQuery.data ?? []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={activityQuery.isRefetching}
            onRefresh={() => activityQuery.refetch()}
            tintColor={colors.primary}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => <ActivityRow item={item} />}
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.separator,
              { backgroundColor: colors.surfaceBorder },
            ]}
          />
        )}
        ListEmptyComponent={
          activityQuery.isError ? (
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
                No pudimos cargar tu actividad.
              </ThemedText>
              <Pressable
                onPress={() => activityQuery.refetch()}
                hitSlop={8}
                style={styles.retryButton}
              >
                <Text style={[styles.retryText, { color: colors.primary }]}>
                  Reintentar
                </Text>
              </Pressable>
            </View>
          ) : (
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
                Aún no hay actividad
              </ThemedText>
              <ThemedText
                style={[styles.emptyDescription, { color: colors.textMuted }]}
              >
                Crea o edita una categoría, un ejercicio o un registro de peso y
                aparecerá aquí.
              </ThemedText>
            </View>
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
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 20,
    marginBottom: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: "center",
    marginTop: 18,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 4,
  },
  retryText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
});

export default ActivityScreen;
